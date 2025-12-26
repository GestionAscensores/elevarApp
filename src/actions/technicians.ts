'use server'

import { db as prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

export async function getTechnicians() {
    const session = await auth()
    if (!session?.user?.id) return []

    return await prisma.technician.findMany({
        where: {
            userId: session.user.id,
            isActive: true
        },
        orderBy: {
            name: 'asc'
        }
    })
}

export async function createTechnician(fd: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autorizado" }

    const name = fd.get('name') as string
    const pin = fd.get('pin') as string
    const avatarUrl = fd.get('avatarUrl') as string | null

    if (!name || !pin || pin.length !== 4) {
        return { error: "Datos inválidos. El PIN debe tener 4 dígitos." }
    }

    try {
        // Handle "Zombie" PINs: If an inactive tech exists with this PIN, rename its PIN to free it up.
        // This handles cases where a tech was deleted BEFORE our fix was implemented.
        const zombieTech = await prisma.technician.findFirst({
            where: {
                userId: session.user.id,
                pin: pin,
                isActive: false // Only target deleted ones
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
                userId: session.user.id,
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
    const session = await auth()
    if (!session?.user?.id) return { error: "No autorizado" }

    // 1. Get current tech to append to PIN (avoiding collision even on deletes)
    const tech = await prisma.technician.findUnique({ where: { id } })
    if (!tech) return { error: "Técnico no encontrado" }

    // 2. Soft delete + Rename PIN to free it up
    await prisma.technician.update({
        where: { id },
        data: {
            isActive: false,
            pin: `${tech.pin}_DEL_${Date.now()}`.slice(0, 30) // Ensure it fits if there's a limit, though PIN is likely short
        }
    })
    revalidatePath('/dashboard/technicians')
    return { success: true }
}

export async function validateTechnicianPin(userId: string, pin: string) {
    // This action is public/semi-public called by the scan page
    // We need the userId (Company Owner ID) because PINs are unique per company

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
