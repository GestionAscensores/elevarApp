import { db } from "@/lib/db"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
})

export async function POST(req: Request) {
    // 1. Verify Secret (Optional for MVP but recommended)
    // const secret = req.headers.get('x-signature') ...

    const body = await req.json()
    const { action, data } = body

    if (action === 'payment.created' || body.type === 'payment') {
        const paymentId = data?.id || body.data?.id

        try {
            const paymentClient = new Payment(client)
            const payment = await paymentClient.get({ id: paymentId })

            if (payment.status === 'approved') {
                const userId = payment.external_reference

                if (userId) {
                    console.log(`Procesando pago aprobado para usuario ${userId}`)

                    // Activate Subscription
                    const newExpiry = new Date()
                    newExpiry.setMonth(newExpiry.getMonth() + 1)

                    await db.user.update({
                        where: { id: userId },
                        data: {
                            subscriptionStatus: 'active',
                            subscriptionExpiresAt: newExpiry,
                            isActive: true,
                        }
                    })

                    // Log Payment for Revenue Tracking
                    await db.subscriptionPayment.create({
                        data: {
                            userId: userId,
                            amount: payment.transaction_amount || 0,
                            provider: 'mercadopago',
                            providerId: String(payment.id),
                            status: 'approved'
                        }
                    })

                    console.log(`Suscripción activada para ${userId}`)
                }
            }
        } catch (error) {
            console.error('Error processing webhook:', error)
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
        }
    }

    return NextResponse.json({ status: 'ok' })
}
