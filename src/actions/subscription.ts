'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

/**
 * Extender período de prueba de un usuario
 */
export async function extendTrial(userId: string, days: number) {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, message: 'No autorizado' }
    }

    if (days <= 0 || days > 365) {
        return { success: false, message: 'El número de días debe estar entre 1 y 365' }
    }

    try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' }
        }

        // Calcular nueva fecha de finalización
        const currentTrialEnd = user.trialEndsAt || new Date()
        const newTrialEnd = new Date(currentTrialEnd)
        newTrialEnd.setDate(newTrialEnd.getDate() + days)

        // Si la suscripción está en trial, también extender la fecha de expiración
        const updates: any = {
            trialEndsAt: newTrialEnd,
            subscriptionStatus: 'trial'
        }

        if (user.subscriptionStatus === 'trial') {
            updates.subscriptionExpiresAt = newTrialEnd
        }

        await db.user.update({
            where: { id: userId },
            data: updates
        })

        revalidatePath('/dashboard/admin/users')
        return {
            success: true,
            message: `Período de prueba extendido ${days} días. Nueva fecha: ${newTrialEnd.toLocaleDateString()}`
        }
    } catch (error) {
        console.error('Error extendiendo prueba:', error)
        return { success: false, message: 'Error al extender período de prueba' }
    }
}

/**
 * Activar suscripción paga para un usuario
 */
export async function activateSubscription(userId: string, months: number) {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, message: 'No autorizado' }
    }

    if (months <= 0 || months > 24) {
        return { success: false, message: 'El número de meses debe estar entre 1 y 24' }
    }

    try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' }
        }

        // Calcular fecha de expiración
        const expirationDate = new Date()
        expirationDate.setMonth(expirationDate.getMonth() + months)

        await db.user.update({
            where: { id: userId },
            data: {
                subscriptionStatus: 'active',
                subscriptionExpiresAt: expirationDate,
                isActive: true
            }
        })

        revalidatePath('/dashboard/admin/users')
        return {
            success: true,
            message: `Suscripción activada por ${months} ${months === 1 ? 'mes' : 'meses'}. Expira: ${expirationDate.toLocaleDateString()}`
        }
    } catch (error) {
        console.error('Error activando suscripción:', error)
        return { success: false, message: 'Error al activar suscripción' }
    }
}

/**
 * Suspender suscripción de un usuario
 */
export async function suspendSubscription(userId: string) {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, message: 'No autorizado' }
    }

    try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' }
        }

        if (user.role === 'ADMIN') {
            return { success: false, message: 'No se puede suspender a un administrador' }
        }

        await db.user.update({
            where: { id: userId },
            data: {
                subscriptionStatus: 'suspended',
                isActive: false
            }
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true, message: 'Suscripción suspendida' }
    } catch (error) {
        console.error('Error suspendiendo suscripción:', error)
        return { success: false, message: 'Error al suspender suscripción' }
    }
}

/**
 * Obtener detalles de suscripción de un usuario
 */
export async function getUserSubscriptionDetails(userId: string) {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') {
        return null
    }

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                cuit: true,
                role: true,
                isActive: true,
                subscriptionStatus: true,
                subscriptionExpiresAt: true,
                trialEndsAt: true,
                createdAt: true
            }
        })

        return user
    } catch (error) {
        console.error('Error obteniendo detalles de usuario:', error)
        return null
    }
}
