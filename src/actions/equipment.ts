'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import QRCode from 'qrcode'
import { revalidatePath } from 'next/cache'

export async function createEquipment(data: {
    clientId: string
    name: string
    type: string
    description?: string
}) {
    const session = await verifySession()
    if (!session) return { error: 'Unauthorized' }

    try {
        // 1. Generate a unique Code for the QR (e.g., specific to this system)
        // Format: ELEVAR-[RANDOM]-[TIMESTAMP]
        const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase()
        const qrCodeValue = `ELEVAR-${uniqueId}`

        // 2. Create Equipment in DB
        const equipment = await db.equipment.create({
            data: {
                clientId: data.clientId,
                name: data.name,
                type: data.type,
                description: data.description,
                qrCode: qrCodeValue,
            }
        })

        revalidatePath(`/dashboard/clients/${data.clientId}`)
        return { success: true, equipment }
    } catch (error: any) {
        console.error('Error creating equipment:', error)
        return { error: 'Error al crear equipo' }
    }
}

export async function deleteEquipment(id: string) {
    const session = await verifySession()
    if (!session) return { error: 'Unauthorized' }

    try {
        await db.equipment.delete({
            where: { id }
        })
        return { success: true }
    } catch (error: any) {
        return { error: 'Error al eliminar equipo' }
    }
}

export async function getClientEquipmentList(clientId: string) {
    const session = await verifySession()
    if (!session) return []

    return await db.equipment.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' }
    })
}

export async function generateQRImage(text: string) {
    try {
        return await QRCode.toDataURL(text)
    } catch (err) {
        console.error(err)
        return null
    }
}
