'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export type ReceiptData = {
    clientId: string
    date: Date
    totalAmount: number
    description?: string
}

export async function getReceipts() {
    const session = await verifySession()
    if (!session) return []

    const receipts = await db.receipt.findMany({
        where: { userId: session.userId },
        include: { client: true },
        orderBy: { number: 'desc' }
    })

    // Convert Decimals
    return receipts.map(r => ({
        ...r,
        totalAmount: Number(r.totalAmount)
    }))
}

export async function createReceipt(data: ReceiptData) {
    const session = await verifySession()
    if (!session) return { success: false, message: 'No autenticado' }

    try {
        // Transaction to get number and create
        const receipt = await db.$transaction(async (tx) => {
            // Get config for number
            const config = await tx.userConfig.findUnique({
                where: { userId: session.userId }
            })

            const nextNumber = (config?.lastReceiptNumber || 0) + 1

            // Create Receipt
            const newReceipt = await tx.receipt.create({
                data: {
                    userId: session.userId,
                    clientId: data.clientId,
                    date: data.date,
                    totalAmount: data.totalAmount,
                    description: data.description,
                    number: nextNumber
                }
            })

            // Update Config
            await tx.userConfig.update({
                where: { userId: session.userId },
                data: { lastReceiptNumber: nextNumber }
            })

            return newReceipt
        })

        revalidatePath('/dashboard/receipts')
        revalidatePath(`/dashboard/clients/${data.clientId}`)
        return { success: true, receipt }

    } catch (error) {
        console.error('Error creating receipt:', error)
        return { success: false, message: 'Error al crear recibo' }
    }
}

export async function deleteReceipt(id: string) {
    const session = await verifySession()
    if (!session) return { success: false, message: 'No autenticado' }

    try {
        await db.receipt.delete({
            where: { id, userId: session.userId }
        })

        revalidatePath('/dashboard/receipts')
        return { success: true }
    } catch (error) {
        return { success: false, message: 'Error al eliminar' }
    }
}
