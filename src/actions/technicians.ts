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

    if (!name || !pin || pin.length !== 4) {
        return { error: "Datos inválidos. El PIN debe tener 4 dígitos." }
    }

    try {
        await prisma.technician.create({
            data: {
                userId: session.user.id,
                name,
                pin
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

    await prisma.technician.update({
        where: { id },
        data: { isActive: false }
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
        name: tech.name
    }
}
