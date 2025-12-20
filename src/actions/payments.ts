'use server'

import { MercadoPagoConfig, Preference } from 'mercadopago'
import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'

// Initialize MP Client
// NOTE: We use strict non-null assertion or fallback to avoid crash if env is missing during build
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
})

export async function createSubscriptionPreference() {
    const session = await verifySession()
    if (!session) {
        return { success: false, message: 'No autorizado' }
    }

    if (!process.env.MP_ACCESS_TOKEN) {
        console.error("MP_ACCESS_TOKEN is missing")
        return { success: false, message: 'Error de configuración de pagos (Token faltante)' }
    }

    try {
        // Fetch user email since session doesn't always have it
        const { db } = await import('@/lib/db')
        const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { email: true }
        })

        if (!user || !user.email) {
            return { success: false, message: 'Usuario sin email configurado' }
        }

        const preference = new Preference(client)

        // Define subscription price (Hardcoded for now or fetch from DB config)
        const price = 15000 // $15.000 ARS

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'subscription-monthly',
                        title: 'Suscripción Mensual - Elevar App',
                        quantity: 1,
                        unit_price: price,
                        currency_id: 'ARS'
                    }
                ],
                payer: {
                    email: user.email,
                },
                back_urls: {
                    success: `${appUrl}/dashboard/subscription/success`,
                    failure: `${appUrl}/dashboard/subscription/failure`,
                    pending: `${appUrl}/dashboard/subscription/pending`
                },
                // auto_return: 'approved',
                binary_mode: true, // Forces "Approved" or "Rejected", no "Pending". Helps in Sandbox.
                external_reference: session.userId,
                notification_url: `${appUrl}/api/webhooks/mercadopago`
            }
        })

        if (result.init_point) {
            return { success: true, url: result.init_point }
        } else {
            return { success: false, message: 'No se pudo generar el link de pago' }
        }

    } catch (error: any) {
        console.error('MP Create Preference Error:', error)
        return { success: false, message: 'Error al conectar con MercadoPago: ' + error.message }
    }
}
