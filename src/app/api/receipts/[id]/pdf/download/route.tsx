import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { ReceiptPDF } from '@/components/receipts/receipt-pdf'
import { renderToBuffer } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await verifySession()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { id } = await params

        const receipt = await db.receipt.findUnique({
            where: { id, userId: session.userId },
            include: {
                client: true,
                user: {
                    include: {
                        config: true
                    }
                }
            }
        })

        if (!receipt) {
            return new NextResponse('Receipt not found', { status: 404 })
        }

        // Render PDF to Buffer
        const pdfBuffer = await renderToBuffer(
            <ReceiptPDF
                receipt={receipt}
                user={receipt.user}
            />
        )

        const filename = `Recibo-${String(receipt.number).padStart(6, '0')}.pdf`

        const response = new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

        return response

    } catch (error: any) {
        console.error("PDF Generate Error Detailed:", error.message, error.stack)
        return new NextResponse('Error generating PDF: ' + error.message, { status: 500 })
    }
}
