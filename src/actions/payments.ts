'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function togglePaymentStatus(invoiceId: string, currentStatus: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    // Logic: PENDING -> PAID -> PENDING
    // Could support CANCELLED in future, but simple toggle for now.
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID'
    const newDate = newStatus === 'PAID' ? new Date() : null

    try {
        await db.invoice.update({
            where: {
                id: invoiceId,
                userId: session.userId
            },
            data: {
                paymentStatus: newStatus,
                paymentDate: newDate
            }
        })

        revalidatePath('/dashboard/billing')
        revalidatePath('/dashboard/clients')
        return { success: true, newStatus }
    } catch (error) {
        console.error("Error toggling payment:", error)
        return { success: false, message: 'Error al actualizar estado de pago' }
    }
}

export async function markMultipleAsPaid(invoiceIds: string[]) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        await db.invoice.updateMany({
            where: {
                id: { in: invoiceIds },
                userId: session.userId
            },
            data: {
                paymentStatus: 'PAID',
                paymentDate: new Date()
            }
        })

        revalidatePath('/dashboard/billing')
        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error) {
        console.error("Error batch update:", error)
        return { success: false, message: 'Error al actualizar facturas' }
    }
}

import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getSubscriptionPrice } from './settings'

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
})

export async function createSubscriptionPreference() {
    const session = await verifySession()
    if (!session || !session.userId) {
        return { success: false, message: 'No autorizado' }
    }

    let price = 0
    try {
        price = await getSubscriptionPrice()
        const preference = new Preference(mpClient)

        // Fallback for local development if env var is missing
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'subscription-monthly',
                        title: 'Suscripción Mensual Elevar App',
                        quantity: 1,
                        unit_price: price, // Dynamic Price
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: `${appUrl}/dashboard`,
                    failure: `${appUrl}/dashboard/subscription`,
                    pending: `${appUrl}/dashboard/subscription`
                },
                notification_url: `${appUrl}/api/webhooks/mercadopago`,
                auto_return: 'approved',
                external_reference: session.userId,
                statement_descriptor: "ELEVAR APP"
            }
        })

        if (!result.init_point) {
            return { success: false, message: 'No se pudo generar el link de pago' }
        }

        return { success: true, url: result.init_point }
    } catch (error) {
        console.error('Error creating preference:', error)
        return { success: false, message: 'Error al conectar con MercadoPago: ' + (error as any).message }
    }
}
