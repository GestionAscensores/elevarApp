import { db } from '@/lib/db'
import { generateInvoiceFilename } from '@/lib/invoice-utils'
import { verifySession } from '@/lib/session'
import { InvoicePDF } from '@/components/billing/invoice-pdf'
import { renderToBuffer, Document, Page, Text, View } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import React from 'react'

export const dynamic = 'force-dynamic'

// Friendly URL Route: /api/invoices/[id]/pdf/download/[filename]
export async function GET(request: Request, { params }: { params: Promise<{ id: string, filename: string }> }) {
    try {
        const session = await verifySession()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { id, filename } = await params

        const invoice = await db.invoice.findUnique({
            where: { id, userId: session.userId },
            include: {
                items: true,
                client: true,
                user: {
                    include: {
                        config: true
                    }
                }
            }
        })

        if (!invoice) {
            console.log("PDF Error: Invoice not found for ID", id)
            return new NextResponse('Invoice not found', { status: 404 })
        }

        // Generate QR Image
        let qrImage = null
        if (invoice.qrCodeData) {
            try {
                const QRCode = require('qrcode')
                qrImage = await QRCode.toDataURL(invoice.qrCodeData)
            } catch (e) {
                console.error("Error generating QR Image:", e)
            }
        }

        // Generate Barcode Image (AFIP Linear - Interleaved 2 of 5)
        // Format: CUIT (11) + Type (2) + Point (4) + CAE (14) + Expires (8) + CheckDigit (1) = 40 digits
        let barcodeImage = null
        if (invoice.cae && invoice.user && invoice.user.cuit && invoice.caeExpiresAt) {
            try {
                const bwipjs = require('bwip-js')

                // Helper to pad
                const pad = (str: string | number, len: number) => String(str).padStart(len, '0')
                const formatDateVto = (d: Date) => {
                    // YYYYMMDD
                    const date = new Date(d)
                    return date.toISOString().slice(0, 10).replace(/-/g, '')
                }

                // Map Invoice Type Letter to AFIP Code (Approximation or use DB if available)
                // We need the ACTUAL AFIP code (e.g. 001, 006, 011).
                // Existing PDF uses approximation: A=001, B=006, C=011. 
                // Ideally this should be stored, but we can derive it same as PDF does.
                let afipCode = '011' // Default C
                const type = invoice.type.replace('NC', '') // if NCA -> A
                if (type === 'A') afipCode = '001'
                if (type === 'B') afipCode = '006'
                if (type.startsWith('NC')) {
                    if (invoice.type === 'NCA') afipCode = '003' // NC A
                    if (invoice.type === 'NCB') afipCode = '008' // NC B
                    if (invoice.type === 'NCC') afipCode = '013' // NC C
                }

                // Construct the 39 digits
                const cuit = invoice.user.cuit.replace(/\D/g, '')
                const ptoVta = pad(invoice.pointOfSale, 4)
                const cae = invoice.cae // 14 digits
                const vto = formatDateVto(invoice.caeExpiresAt)

                const code39 = `${cuit}${pad(afipCode, 2)}${ptoVta}${cae}${vto}`

                // Calculate Verifier Digit (Modulo 10 AFIP)
                // Step 1: Sum odd positions (indices 0, 2, 4...)
                let oddSum = 0
                for (let i = 0; i < code39.length; i += 2) oddSum += parseInt(code39[i])

                // Step 2: Multiply by 3
                oddSum *= 3

                // Step 3: Sum even positions (indices 1, 3, 5...)
                let evenSum = 0
                for (let i = 1; i < code39.length; i += 2) evenSum += parseInt(code39[i])

                // Step 4: Sum results
                const total = oddSum + evenSum

                // Step 5: Check digit is what's needed to reach next multiple of 10
                const checkDigit = (10 - (total % 10)) % 10

                const finalCode = `${code39}${checkDigit}`

                barcodeImage = await bwipjs.toBuffer({
                    bcid: 'interleaved2of5',       // Barcode type
                    text: finalCode,    // Text to encode
                    scale: 3,               // 3x scaling factor
                    height: 10,              // Bar height, in millimeters
                    includetext: true,            // Show human-readable text
                    textxalign: 'center',        // Always good to align this
                })

                // Convert to data uri
                barcodeImage = `data:image/png;base64,${barcodeImage.toString('base64')}`

            } catch (e) {
                console.error("Error generating Barcode:", e)
            }
        }

        // Render PDF to Buffer
        const pdfBuffer = await renderToBuffer(
            <InvoicePDF
                invoice={invoice}
                user={invoice.user}
                client={invoice.client}
                items={invoice.items}
                qrImage={qrImage}
                barcodeImage={barcodeImage}
            />
        )



        console.log("PDF: Buffer generated. Size:", pdfBuffer.length)

        // Use the filename provided in the URL if valid, otherwise fallback usage the shared utility
        const finalFilename = filename || generateInvoiceFilename(invoice)

        // Create response with the buffer
        // Note: casting buffer to any is standard workaround for Next.js types
        const response = new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                // Force attachment to ensure it downloads with the correct filename
                'Content-Disposition': `attachment; filename="${finalFilename}"`
            }
        })

        return response

    } catch (error: any) {
        console.error("PDF Generate Error Detailed:", error.message, error.stack)
        return new NextResponse('Error generating PDF: ' + error.message, { status: 500 })
    }
}
