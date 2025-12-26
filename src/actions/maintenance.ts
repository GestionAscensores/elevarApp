'use server'

import { db as prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getPublicStatus(clientId: string) {
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
            name: true,
            address: true,
            userId: true, // Need this to validate techs
            maintenanceVisits: {
                orderBy: { date: 'desc' },
                take: 1,
                include: {
                    technician: {
                        select: {
                            name: true,
                            avatarUrl: true
                        }
                    }
                }
            }
        }
    })

    if (!client) return null

    const lastVisit = client.maintenanceVisits[0]

    return {
        clientName: client.name,
        clientAddress: client.address,
        companyId: client.userId,
        status: lastVisit ? lastVisit.status : 'Sin Datos', // 'Completada', 'En Reparacion'
        lastVisit: lastVisit ? {
            date: lastVisit.date,
            technicianName: lastVisit.technician.name,
            technicianAvatar: lastVisit.technician.avatarUrl,
            publicNotes: lastVisit.publicNotes,
            locationLat: lastVisit.locationLat,
            locationLng: lastVisit.locationLng
        } : null
    }
}

export async function getEquipmentStatus(equipmentId: string) {
    const equipment = await prisma.equipment.findUnique({
        where: { id: equipmentId },
        include: {
            client: {
                select: {
                    id: true, // Need this for FK
                    name: true,
                    address: true,
                    userId: true
                }
            },
            visits: {
                orderBy: { date: 'desc' },
                take: 1,
                include: {
                    technician: {
                        select: {
                            name: true,
                            avatarUrl: true
                        }
                    }
                }
            }
        }
    })

    if (!equipment) return null

    const lastVisit = equipment.visits[0]

    return {
        equipmentName: equipment.name,
        equipmentType: equipment.type,
        clientName: equipment.client.name,
        clientAddress: equipment.client.address,
        companyId: equipment.client.userId,
        clientId: equipment.client.id, // Return correct Client ID for VisitForm
        status: lastVisit ? lastVisit.status : 'Sin Datos',
        lastVisit: lastVisit ? {
            date: lastVisit.date,
            technicianName: lastVisit.technician.name,
            technicianAvatar: lastVisit.technician.avatarUrl,
            publicNotes: lastVisit.publicNotes,
            locationLat: lastVisit.locationLat,
            locationLng: lastVisit.locationLng
        } : null
    }
}


export async function registerVisit(data: {
    clientId: string,
    technicianId: string,
    type: string,
    publicNotes?: string,
    privateNotes?: string,
    locationLat?: number,
    locationLng?: number,
    proofUrl?: string,
    equipmentId?: string
}) {
    try {
        await prisma.maintenanceVisit.create({
            data: {
                clientId: data.clientId,
                technicianId: data.technicianId,
                type: data.type,
                publicNotes: data.publicNotes,
                privateNotes: data.privateNotes,
                locationLat: data.locationLat,
                locationLng: data.locationLng,
                proofUrl: data.proofUrl,
                status: 'Completada', // Default finalized
                equipmentId: data.equipmentId
            }
        })

        // Revalidate generic client page AND equipment specific page
        revalidatePath(`/scan/${data.clientId}`)
        if (data.equipmentId) {
            revalidatePath(`/scan/equipment/${data.equipmentId}`)
        }

        return { success: true }
        return { error: `Error: ${e.message || "Error desconocido al registrar"}` }
    }
}

export async function getEquipmentVisits(equipmentId: string) {
    try {
        const visits = await prisma.maintenanceVisit.findMany({
            where: { equipmentId },
            orderBy: { date: 'desc' },
            include: {
                technician: {
                    select: { name: true, avatarUrl: true }
                }
            }
        })
        return visits
    } catch (e) {
        console.error("Error fetching equipment visits:", e)
        return []
    }
}
