'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { sendMail } from '@/lib/mail'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/billing/invoice-pdf'
import React from 'react'

export async function sendInvoiceEmail(invoiceId: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const invoice = await db.invoice.findUnique({
        where: { id: invoiceId, userId: session.userId },
        include: {
            client: true,
            items: true,
            user: {
                include: { config: true }
            }
        }
    })

    if (!invoice) return { message: 'Factura no encontrada' }
    if (!invoice.client.email) return { message: 'El cliente no tiene un email configurado.' }

    try {
        // Generate PDF Buffer
        // We need to use createElement because this is a .ts file

        const pdfBuffer = await renderToBuffer(
            React.createElement(InvoicePDF, {
                invoice,
                client: invoice.client,
                user: invoice.user,
                items: invoice.items
            }) as any
        )

        const config = invoice.user.config

        // Default values
        const isQuote = invoice.status === 'QUOTE'
        const docName = isQuote ? 'Presupuesto' : 'Factura'
        const docNumber = isQuote ? `ID-${String(invoice.id).slice(-4)}` : `${invoice.type}-${String(invoice.number).padStart(8, '0')}`

        let subject = `Facturación Ascensor ${invoice.client.name}`

        // Calculate Month Name (Spanish)
        // PRIORITIZE service period if available (Correct billing mont)
        // Fallback to emission date only if no service period (e.g. products)
        const dateToUse = invoice.serviceTo ? new Date(invoice.serviceTo) :
            invoice.serviceFrom ? new Date(invoice.serviceFrom) :
                new Date(invoice.date)

        const monthName = dateToUse.toLocaleString('es-AR', { month: 'long', timeZone: 'UTC' })
        const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)

        let htmlContent = `Se adjunta comprobantes por mantenimiento Asc. correspondiente al mes de ${monthCapitalized}.<br><br>Saludos cordiales.`

        // Override if config exists
        if (config?.emailSubject) {
            subject = config.emailSubject
                .replace('{{cliente}}', invoice.client.name)
                .replace('{{numero}}', docNumber)
                .replace('{{mes}}', monthCapitalized)
        }

        if (config?.emailBody) {
            htmlContent = config.emailBody
                .replace('{{cliente}}', invoice.client.name)
                .replace('{{numero}}', docNumber)
                .replace('{{mes}}', monthCapitalized)
                .replace(/\n/g, '<br>') // Convert newlines to breaks
        }

        const senderName = config?.fantasyName || config?.businessName || invoice.user.name || 'Elevar App'

        const result = await sendMail({
            to: invoice.client.email,
            replyTo: config?.businessEmail || invoice.user.email || undefined,
            fromName: senderName,
            subject,
            html: htmlContent,
            attachments: [
                {
                    filename: `${docName}-${docNumber}.pdf`,
                    content: pdfBuffer
                }
            ]
        })

        if (!result.success) throw new Error(result.error)

        // Update tracking stats
        await db.invoice.update({
            where: { id: invoiceId },
            data: {
                sentCount: { increment: 1 },
                lastSentAt: new Date()
            }
        })

        return { success: true, message: `Email enviado a ${invoice.client.email}` }

    } catch (error: any) {
        console.error('Email Error:', error)
        return { message: 'Error al enviar el email: ' + error.message }
    }
}
