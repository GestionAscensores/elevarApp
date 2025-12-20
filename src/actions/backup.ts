'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'

export async function exportUserData() {
    const session = await verifySession()
    if (!session) return { error: 'No autorizado' }

    try {
        const userId = session.userId

        // Fetch all data in parallel
        const [userConfig, clients, products, invoices] = await Promise.all([
            db.userConfig.findUnique({ where: { userId } }),
            db.client.findMany({ where: { userId } }),
            db.product.findMany({ where: { userId } }),
            db.invoice.findMany({
                where: { userId },
                include: { items: true }
            })
        ])

        const backupData = {
            metadata: {
                version: '1.0',
                date: new Date().toISOString(),
                userId
            },
            config: userConfig,
            clients,
            products,
            invoices
        }

        return { data: JSON.stringify(backupData, null, 2) }

    } catch (error: any) {
        console.error('Backup Error:', error)
        return { error: 'Error al generar el respaldo.' }
    }
}
