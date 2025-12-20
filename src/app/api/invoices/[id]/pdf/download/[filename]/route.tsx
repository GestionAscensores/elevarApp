
import { db } from '@/lib/db'
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

        // Render PDF to Buffer
        const pdfBuffer = await renderToBuffer(
            <InvoicePDF
                invoice={invoice}
                user={invoice.user}
                client={invoice.client}
                items={invoice.items}
                qrImage={qrImage}
            />
        )



        console.log("PDF: Buffer generated. Size:", pdfBuffer.length)

        // Use the filename provided in the URL if valid, otherwise fallback
        const finalFilename = filename || (invoice.status === 'QUOTE'
            ? `Presupuesto-${String(invoice.id).slice(-6)}.pdf`
            : `Factura-${String(invoice.number).padStart(3, '0')}.pdf`)

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
