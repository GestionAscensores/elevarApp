'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { sendMail } from '@/lib/mail'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/billing/invoice-pdf'
import { revalidatePath } from 'next/cache'
import React from 'react'

export async function sendInvoiceEmail(invoiceId: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const invoice = await db.invoice.findUnique({
        where: { id: invoiceId, userId: session.userId },
        include: {
            client: true,
            items: {
                include: { product: true }
            },
            user: {
                include: { config: true }
            }
        }
    })

    if (!invoice) return { message: 'Factura no encontrada' }
    if (!invoice.client.email) return { message: 'El cliente no tiene un email configurado.' }

    // Generate QR Image
    let qrImage = null
    if (invoice.qrCodeData) {
        try {
            const QRCode = require('qrcode')
            qrImage = await QRCode.toDataURL(invoice.qrCodeData)
        } catch (e) {
            console.error("Error generating QR Image for Email:", e)
        }
    }

    // Generate Barcode Image (AFIP Linear - Interleaved 2 of 5)
    let barcodeImage = null
    if (invoice.cae && invoice.user && invoice.user.cuit && invoice.caeExpiresAt) {
        try {
            const bwipjs = require('bwip-js')

            const pad = (str: string | number, len: number) => String(str).padStart(len, '0')
            const formatDateVto = (d: Date) => {
                const date = new Date(d)
                return date.toISOString().slice(0, 10).replace(/-/g, '')
            }

            let afipCode = '011'
            const type = invoice.type.replace('NC', '')
            if (type === 'A') afipCode = '001'
            if (type === 'B') afipCode = '006'
            if (invoice.type === 'NCA') afipCode = '003'
            if (invoice.type === 'NCB') afipCode = '008'
            if (invoice.type === 'NCC') afipCode = '013'

            const cuit = invoice.user.cuit.replace(/\D/g, '')
            const ptoVta = pad(invoice.pointOfSale, 4)
            const cae = invoice.cae
            const vto = formatDateVto(invoice.caeExpiresAt)

            const code39 = `${cuit}${pad(afipCode, 2)}${ptoVta}${cae}${vto}`

            let oddSum = 0
            for (let i = 0; i < code39.length; i += 2) oddSum += parseInt(code39[i])
            oddSum *= 3
            let evenSum = 0
            for (let i = 1; i < code39.length; i += 2) evenSum += parseInt(code39[i])
            const total = oddSum + evenSum
            const checkDigit = (10 - (total % 10)) % 10
            const finalCode = `${code39}${checkDigit}`

            const buffer = await bwipjs.toBuffer({
                bcid: 'interleaved2of5',
                text: finalCode,
                scale: 3,
                height: 10,
                includetext: true,
                textxalign: 'center',
            })
            barcodeImage = `data:image/png;base64,${buffer.toString('base64')}`
        } catch (e) {
            console.error("Error generating Barcode for Email:", e)
        }
    }

    try {
        // Generate PDF Buffer
        const pdfBuffer = await renderToBuffer(
            React.createElement(InvoicePDF, {
                invoice,
                client: invoice.client,
                user: invoice.user,
                items: invoice.items,
                qrImage,
                barcodeImage
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

        // Items Summary for {{detalle}} (Full Description)
        const itemsDetail = invoice.items.map(i => i.description).join(' + ')

        // Products List for {{productos}} (Clean Product Names)
        const productsList = invoice.items.map((i: any) => {
            return i.product?.name || i.description || 'Item'
        }).join(' + ')

        const senderName = config?.fantasyName || config?.businessName || invoice.user.name || 'Elevar App'

        // Default Template requested by User:
        // "Se adjunta factura por, {{detalle}}.<br>Atte<br>{{empresa}}"
        let htmlContent = `Se adjunta factura por, ${itemsDetail}.<br>Atte<br>${senderName}`

        const replaceVariables = (text: string) => {
            return text
                .replace('{{cliente}}', invoice.client.name)
                .replace('{{numero}}', docNumber)
                .replace('{{mes}}', monthCapitalized)
                .replace('{{detalle}}', itemsDetail)
                .replace('{{productos}}', productsList)
                .replace('{{empresa}}', senderName)
        }

        // Override if config exists
        if (config?.emailSubject) {
            subject = replaceVariables(config.emailSubject)
        }

        if (config?.emailBody) {
            htmlContent = replaceVariables(config.emailBody)
                .replace(/\n/g, '<br>') // Convert newlines to breaks
        }

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

export async function sendMassEmails(invoiceIds: string[]) {
    const session = await verifySession()
    if (!session) return { success: false, message: 'No autorizado' }

    if (!invoiceIds || invoiceIds.length === 0) return { success: false, message: 'No se seleccionaron facturas' }

    let successCount = 0
    let failureCount = 0

    // Sequential processing with delay to avoid rate limits
    for (const id of invoiceIds) {
        // 1.5 second delay between emails
        await new Promise(resolve => setTimeout(resolve, 1500))

        const result = await sendInvoiceEmail(id)
        if (result.success || (result.message && result.message.includes('enviado'))) {
            successCount++
        } else {
            console.error(`Failed to send email for invoice ${id}: ${result.message}`)
            failureCount++
        }
    }

    revalidatePath('/dashboard/billing')

    if (failureCount === 0) {
        return { success: true, message: `Se enviaron ${successCount} correos correctamente.` }
    } else {
        return { success: false, message: `Enviados: ${successCount}. Fallidos: ${failureCount}. Verifique los logs o intente nuevamente.` }
    }
}
