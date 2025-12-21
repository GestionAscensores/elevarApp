'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function resetAccountData(confirmation: string) {
    const session = await verifySession()

    // STRICT SECURITY Check
    if (!session || session.role !== 'ADMIN') {
        return { error: 'No autorizado. Solo administradores.' }
    }

    if (confirmation !== 'BORRAR') {
        return { error: 'Confirmación incorrecta. Debe escribir "BORRAR".' }
    }

    try {
        // Transaction to ensure atomicity
        await db.$transaction(async (tx) => {
            // Delete Receipts first (might reference invoices or clients)
            await tx.receipt.deleteMany({
                where: { userId: session.userId }
            })

            // Delete Invoices
            await tx.invoice.deleteMany({
                where: { userId: session.userId }
            })

            // Optionally: Delete Maintenance Visits? 
            // The user only said "arrancar en serio con la facturación".
            // Clients/Products are kept.

            // Reset Price History (Requested for production transition)
            await tx.priceHistory.deleteMany({
                where: {
                    client: { userId: session.userId }
                }
            })

            // Reset counters?
            await tx.userConfig.update({
                where: { userId: session.userId },
                data: {
                    lastDraftNumber: 0,
                    lastReceiptNumber: 0
                }
            })
        })

        revalidatePath('/dashboard')
        return { success: true, message: 'Base de datos de facturación reiniciada correctamente.' }
    } catch (error) {
        console.error('Reset Data Error:', error)
        return { error: 'Error al limpiar la base de datos.' }
    }
}
