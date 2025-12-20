
'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') return []

    const users = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { invoices: true, clients: true } },
            config: true
        }
    })

    return users.map(u => ({
        id: u.id,
        cuit: u.cuit,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        subscriptionStatus: u.subscriptionStatus,
        subscriptionExpiresAt: u.subscriptionExpiresAt?.toISOString() || null,
        trialEndsAt: u.trialEndsAt?.toISOString() || null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        acceptedTermsAt: u.acceptedTermsAt?.toISOString() || null,
        isEmailVerified: u.isEmailVerified,
        image: u.image,
        invoiceCount: u._count.invoices,
        clientCount: u._count.clients,
        config: u.config
    }))
}

export async function toggleUserStatus(userId: string) {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') return { message: 'No autorizado' }

    if (userId === session.userId) return { message: 'No puedes desactivar tu propia cuenta.' }

    try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (!user) return { message: 'Usuario no encontrado' }

        await db.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive }
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (error) {
        return { message: 'Error al cambiar estado' }
    }
}

/**
 * Delete a user and all their associated data.
 * Requires ADMIN role.
 */
export async function deleteUser(userId: string) {
    try {
        const session = await verifySession()
        if (!session || session.role !== 'ADMIN') {
            return { error: 'No autorizado. Se requiere rol de Administrador.' }
        }

        // Prevent self-deletion
        if (session.userId === userId) {
            return { error: 'No puedes eliminar tu propia cuenta.' }
        }

        // Logic check: We naturally allow deleting other admins as long as it's not self.
        // Prisma will handle the deletion.

        await db.user.delete({
            where: { id: userId }
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error deleting user:', error)
        return { error: 'Error al eliminar usuario.' }
    }
}

/**
 * Update a user's role.
 * Requires ADMIN role.
 */
export async function updateUserRole(userId: string, newRole: string) {
    try {
        const session = await verifySession()
        if (!session || session.role !== 'ADMIN') {
            return { error: 'No autorizado. Se requiere rol de Administrador.' }
        }

        // Prevent self-demotion
        if (session.userId === userId && newRole !== 'ADMIN') {
            return { error: 'No puedes cambiar tu propio rol.' }
        }

        await db.user.update({
            where: { id: userId },
            data: { role: newRole }
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error updating role:', error)
        return { error: 'Error al actualizar rol.' }
    }
}

/**
 * Update a user's profile information.
 * Requires ADMIN role.
 */
export async function updateUserProfile(userId: string, data: {
    name: string,
    email: string,
    cuit: string,
    trialEndsAt?: string,
    subscriptionExpiresAt?: string
}) {
    try {
        const session = await verifySession()
        if (!session || session.role !== 'ADMIN') {
            return { error: 'No autorizado. Se requiere rol de Administrador.' }
        }

        // Validate unique constraints if email/cuit changed
        if (data.email) {
            const existing = await db.user.findFirst({
                where: {
                    email: data.email,
                    NOT: { id: userId }
                }
            })
            if (existing) return { error: 'El email ya está en uso por otro usuario.' }
        }

        if (data.cuit) {
            const existing = await db.user.findFirst({
                where: {
                    cuit: data.cuit,
                    NOT: { id: userId }
                }
            })
            if (existing) return { error: 'El CUIT ya está en uso por otro usuario.' }
        }

        await db.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                email: data.email,
                cuit: data.cuit || null,
                trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
                subscriptionExpiresAt: data.subscriptionExpiresAt ? new Date(data.subscriptionExpiresAt) : null
            }
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error updating profile:', error)
        return { error: 'Error al actualizar perfil.' }
    }
}
