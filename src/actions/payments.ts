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

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
})

export async function createSubscriptionPreference() {
    const session = await verifySession()
    if (!session || !session.userId) {
        return { success: false, message: 'No autorizado' }
    }

    try {
        const preference = new Preference(mpClient)

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'subscription-monthly',
                        title: 'Suscripción Mensual Elevar App',
                        quantity: 1,
                        unit_price: 15000,
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`
                },
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
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
        return { success: false, message: 'Error al conectar con MercadoPago' }
    }
}
