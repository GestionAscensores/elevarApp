'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createTask(data: {
    clientId: string,
    description: string,
    priority: string, // 'NORMAL' | 'URGENT'
    equipmentId?: string,
    createdBy?: string
}) {
    try {
        const task = await db.maintenanceTask.create({
            data: {
                clientId: data.clientId,
                description: data.description,
                priority: data.priority,
                equipmentId: data.equipmentId,
                createdBy: data.createdBy,
                status: 'PENDING'
            }
        })

        revalidatePath('/dashboard/tasks')
        revalidatePath(`/dashboard/clients/${data.clientId}`)
        return { success: true, task }
    } catch (e) {
        console.error("Error creating task:", e)
        return { error: "Error al crear tarea pendiente" }
    }
}

export async function getPendingTasks(clientId?: string) {
    const whereClause = clientId
        ? { clientId, status: 'PENDING' }
        : { status: 'PENDING' }

    try {
        return await db.maintenanceTask.findMany({
            where: whereClause,
            include: {
                client: {
                    select: { name: true, address: true }
                },
                equipment: {
                    select: { name: true, type: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    } catch (e) {
        console.error("Error fetching tasks:", e)
        return []
    }
}

export async function updateTaskStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'DONE') {
    try {
        const data: any = { status }
        if (status === 'DONE') {
            data.completedAt = new Date()
        }

        await db.maintenanceTask.update({
            where: { id },
            data
        })

        revalidatePath('/dashboard/tasks')
        return { success: true }
    } catch (e) {
        return { error: "Error al actualizar tarea" }
    }
}

export async function deleteTask(id: string) {
    try {
        await db.maintenanceTask.delete({
            where: { id }
        })
        revalidatePath('/dashboard/tasks')
        return { success: true }
    } catch (e) {
        return { error: "Error al eliminar tarea" }
    }
}
