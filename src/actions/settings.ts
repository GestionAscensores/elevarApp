'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

const SUBSCRIPTION_PRICE_KEY = 'SUBSCRIPTION_PRICE'
const DEFAULT_PRICE = '25000'

// Get current price (Public)
export async function getSubscriptionPrice() {
    try {
        const setting = await db.systemSetting.findUnique({
            where: { key: SUBSCRIPTION_PRICE_KEY }
        })

        return Number(setting?.value || DEFAULT_PRICE)
    } catch (e) {
        console.error("Error fetching price:", e)
        return Number(DEFAULT_PRICE)
    }
}

// Update price (Admin only)
export async function updateSubscriptionPrice(newPrice: number) {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, message: 'No autorizado' }
    }

    try {
        await db.systemSetting.upsert({
            where: { key: SUBSCRIPTION_PRICE_KEY },
            update: { value: String(newPrice) },
            create: {
                key: SUBSCRIPTION_PRICE_KEY,
                value: String(newPrice),
                description: 'Precio mensual de la suscripción Elevar App'
            }
        })

        revalidatePath('/')
        revalidatePath('/dashboard/subscription')
        revalidatePath('/dashboard/admin')

        return { success: true }
    } catch (e) {
        console.error("Error updating price:", e)
        return { success: false, message: 'Error al actualizar el precio' }
    }
}
