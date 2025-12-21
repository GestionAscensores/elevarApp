'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function togglePaymentStatus(invoiceId: string, currentStatus: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    // Logic: PENDING -> PAID -> PENDING
    // Could support CANCELLED in future, but simple toggle for now.
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID'
    const newDate = newStatus === 'PAID' ? new Date() : null

    try {
        await db.invoice.update({
            where: {
                id: invoiceId,
                userId: session.userId
            },
            data: {
                paymentStatus: newStatus,
                paymentDate: newDate
            }
        })

        revalidatePath('/dashboard/billing')
        revalidatePath('/dashboard/clients')
        return { success: true, newStatus }
    } catch (error) {
        console.error("Error toggling payment:", error)
        return { success: false, message: 'Error al actualizar estado de pago' }
    }
}

export async function markMultipleAsPaid(invoiceIds: string[]) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        await db.invoice.updateMany({
            where: {
                id: { in: invoiceIds },
                userId: session.userId
            },
            data: {
                paymentStatus: 'PAID',
                paymentDate: new Date()
            }
        })

        revalidatePath('/dashboard/billing')
        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error) {
        console.error("Error batch update:", error)
        return { success: false, message: 'Error al actualizar facturas' }
    }
}
