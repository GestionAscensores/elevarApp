'use server'

import { db as prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/session'

export async function getTechnicians() {
    const session = await verifySession()
    if (!session?.userId) return []

    return await prisma.technician.findMany({
        where: {
            userId: session.userId,
            isActive: true
        },
        orderBy: {
            name: 'asc'
        }
    })
}

export async function createTechnician(fd: FormData) {
    const session = await verifySession()
    if (!session?.userId) return { error: "No autorizado" }

    const name = fd.get('name') as string
    const pin = fd.get('pin') as string
    const avatarUrl = fd.get('avatarUrl') as string | null

    if (!name || !pin || pin.length !== 4) {
        return { error: "Datos inválidos. El PIN debe tener 4 dígitos." }
    }

    try {
        // Handle "Zombie" PINs
        const zombieTech = await prisma.technician.findFirst({
            where: {
                userId: session.userId,
                pin: pin,
                isActive: false
            }
        })

        if (zombieTech) {
            await prisma.technician.update({
                where: { id: zombieTech.id },
                data: { pin: `${zombieTech.pin}_OLD_${Date.now()}`.slice(0, 30) }
            })
        }

        // Now create the new one
        await prisma.technician.create({
            data: {
                userId: session.userId,
                name,
                pin,
                avatarUrl
            }
        })
        revalidatePath('/dashboard/technicians')
        return { success: true }
    } catch (e) {
        return { error: "Error al crear técnico. Es posible que el PIN ya esté en uso." }
    }
}

export async function deleteTechnician(id: string) {
    const session = await verifySession()
    if (!session?.userId) return { error: "No autorizado" }

    const tech = await prisma.technician.findUnique({ where: { id } })
    if (!tech) return { error: "Técnico no encontrado" }

    await prisma.technician.update({
        where: { id },
        data: {
            isActive: false,
            pin: `${tech.pin}_DEL_${Date.now()}`.slice(0, 30)
        }
    })
    revalidatePath('/dashboard/technicians')
    return { success: true }
}

export async function validateTechnicianPin(userId: string, pin: string) {
    // Public/Semi-public action
    const tech = await prisma.technician.findFirst({
        where: {
            userId,
            pin,
            isActive: true
        }
    })

    if (!tech) return null

    return {
        id: tech.id,
        name: tech.name,
        avatarUrl: tech.avatarUrl
    }
}

export async function updateTechnicianName(id: string, name: string) {
    const session = await verifySession()
    if (!session?.userId) return { success: false, message: "No autorizado" }

    try {
        await prisma.technician.update({
            where: { id, userId: session.userId },
            data: { name }
        })
        revalidatePath('/dashboard/technicians')
        return { success: true }
    } catch (e) {
        return { success: false, message: "Error al actualizar nombre" }
    }
}

export async function updateTechnicianPin(id: string, pin: string) {
    const session = await verifySession()
    if (!session?.userId) return { success: false, message: "No autorizado" }

    if (!pin || pin.length !== 4) return { success: false, message: "El PIN debe tener 4 dígitos" }

    try {
        const existing = await prisma.technician.findFirst({
            where: {
                userId: session.userId,
                pin,
                isActive: true,
                NOT: { id }
            }
        })

        if (existing) return { success: false, message: "PIN ya está en uso" }

        await prisma.technician.update({
            where: { id, userId: session.userId },
            data: { pin }
        })
        revalidatePath('/dashboard/technicians')
        return { success: true }
    } catch (e) {
        return { success: false, message: "Error al actualizar PIN" }
    }
}

export async function updateTechnicianAvatar(id: string, base64: string) {
    const session = await verifySession()
    if (!session?.userId) return { success: false, message: "No autorizado" }

    try {
        await prisma.technician.update({
            where: { id, userId: session.userId },
            data: { avatarUrl: base64 }
        })
        revalidatePath('/dashboard/technicians')
        return { success: true }
    } catch (e) {
        return { success: false, message: "Error al actualizar foto" }
    }
}

export async function deleteTechnicianAvatar(id: string) {
    const session = await verifySession()
    if (!session?.userId) return { success: false, message: "No autorizado" }

    try {
        await prisma.technician.update({
            where: { id, userId: session.userId },
            data: { avatarUrl: null }
        })
        revalidatePath('/dashboard/technicians')
        return { success: true }
    } catch (e) {
        return { success: false, message: "Error al eliminar foto" }
    }
}
