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

    // Fetch User Config for Logo
    const userConfig = await prisma.userConfig.findUnique({
        where: { userId: client.userId },
        select: { logoUrl: true }
    })

    const lastVisit = client.maintenanceVisits[0]

    return {
        clientName: client.name,
        clientAddress: client.address,
        companyId: client.userId,
        companyLogo: userConfig?.logoUrl,
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
                take: 5, // Fetch last 5 visits for history
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

    // Fetch User Config for Logo
    const userConfig = await prisma.userConfig.findUnique({
        where: { userId: equipment.client.userId },
        select: { logoUrl: true }
    })

    const lastVisit = equipment.visits[0]

    // Status Logic: 
    // IF Equipment.status is STOPPED/LIMITED, use that.
    // ELSE use lastVisit status or 'Sin Datos'.
    // Actually, 'EQUIPMENT.status' should be the source of truth for "En Servicio / Fuera de Servicio".
    // Schema has `status` field on Equipment thanks to previous changes.

    // Let's ensure types are correct. equipment.status should exist. 
    // If equipment has no status field yet in Prisma types (might need verify), we assume it does based on task.
    // We prioritize Equipment.status if it's "STOPPED".

    // @ts-ignore - Status field added recently
    const currentStatus = equipment.status || (lastVisit ? lastVisit.status : 'Sin Datos')

    return {
        equipmentName: equipment.name,
        equipmentType: equipment.type,
        clientName: equipment.client.name,
        clientAddress: equipment.client.address,
        companyId: equipment.client.userId,
        clientId: equipment.client.id,
        companyLogo: userConfig?.logoUrl,
        status: currentStatus,
        lastVisit: lastVisit ? {
            date: lastVisit.date,
            technicianName: lastVisit.technician.name,
            technicianAvatar: lastVisit.technician.avatarUrl,
            publicNotes: lastVisit.publicNotes,
            locationLat: lastVisit.locationLat,
            locationLng: lastVisit.locationLng
        } : null,
        history: equipment.visits.map(v => ({
            id: v.id,
            date: v.date,
            technicianName: v.technician.name,
            technicianAvatar: v.technician.avatarUrl,
            publicNotes: v.publicNotes,
            status: v.status
        }))
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
    equipmentId?: string,
    equipmentStatus?: string
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

        // Update Equipment Status if provided
        if (data.equipmentId && data.equipmentStatus) {
            await prisma.equipment.update({
                where: { id: data.equipmentId },
                data: { status: data.equipmentStatus }
            })
        }

        // Revalidate generic client page AND equipment specific page
        revalidatePath(`/scan/${data.clientId}`)
        if (data.equipmentId) {
            revalidatePath(`/scan/equipment/${data.equipmentId}`)
        }

        return { success: true }
    } catch (e: any) {
        console.error("REGISTER VISIT ERROR:", e)
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

export async function updateMaintenanceVisit(visitId: string, data: { status?: string, publicNotes?: string, privateNotes?: string }) {
    try {
        await prisma.maintenanceVisit.update({
            where: { id: visitId },
            data
        })
        revalidatePath('/dashboard/clients') // Rough revalidation
        return { success: true }
    } catch (e: any) {
        console.error("UPDATE VISIT ERROR:", e)
        return { error: e.message }
    }
}
