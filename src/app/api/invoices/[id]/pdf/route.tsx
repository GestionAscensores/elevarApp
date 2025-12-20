
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { InvoicePDF } from '@/components/billing/invoice-pdf'
import { renderToBuffer, Document, Page, Text, View } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import React from 'react'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await verifySession()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { id } = await params

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

        const isQuote = invoice.status === 'QUOTE'
        const filename = isQuote
            ? `presupuesto-${String(invoice.id).slice(-6)}.pdf`
            : `factura-${invoice.type}-${invoice.number}.pdf`

        // Check for JSON format request
        const url = new URL(request.url)
        const format = url.searchParams.get('format')

        if (format === 'json') {
            const base64 = (pdfBuffer as Buffer).toString('base64')
            return NextResponse.json({
                filename,
                content: base64,
                contentType: 'application/pdf'
            })
        }

        const headers = new Headers()
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `attachment; filename="${filename}"`)
        headers.set('Content-Length', String(pdfBuffer.length))

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers,
        })

    } catch (error: any) {
        console.error("PDF Generate Error Detailed:", error.message, error.stack)
        return new NextResponse('Error generating PDF: ' + error.message, { status: 500 })
    }
}
