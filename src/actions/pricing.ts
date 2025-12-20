'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function massUpdatePrices(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { success: false, message: 'No autorizado' }

    const percentage = Number(formData.get('percentage'))
    const frequency = formData.get('frequency') as string // 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ALL'

    if (!percentage || percentage <= 0) {
        return { success: false, message: 'Porcentaje inválido' }
    }

    try {
        // Get current month in format "2025-01" (Argentina UTC-3)
        const now = new Date()
        const argTime = new Date(now.getTime() - 3 * 60 * 60 * 1000)
        const currentMonth = argTime.toISOString().slice(0, 7)

        // Build filter based on frequency
        const filter: any = {
            userId: session.userId,
            excludeFromMassUpdate: false
        }

        if (frequency && frequency !== 'ALL') {
            filter.priceUpdateFrequency = frequency
        }

        // Get clients to update
        const clients = await db.client.findMany({
            where: filter,
            include: { items: true }
        })

        if (clients.length === 0) {
            return { success: false, message: 'No hay clientes para actualizar con estos filtros' }
        }

        // Update prices and create history
        const updates = []
        for (const client of clients) {
            for (const item of client.items) {
                const oldPrice = Number(item.price)
                const newPrice = Math.round(oldPrice * (1 + percentage / 100)) // Redondeo sin decimales

                if (oldPrice !== newPrice) {
                    updates.push(
                        db.clientEquipment.update({
                            where: { id: item.id },
                            data: { price: newPrice }
                        }),
                        db.priceHistory.create({
                            data: {
                                clientId: client.id,
                                previousPrice: oldPrice,
                                newPrice: newPrice,
                                percentageChange: percentage,
                                month: currentMonth,
                                updatedBy: session.userId,
                                isMassUpdate: true
                            }
                        })
                    )
                }
            }
        }

        if (updates.length === 0) {
            return { success: false, message: 'No hubo cambios de precios para aplicar' }
        }

        await db.$transaction(updates)

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/clients')

        return {
            success: true,
            message: `Actualización masiva completada. ${clients.length} clientes actualizados (+${percentage}%)`
        }
    } catch (error) {
        console.error('Error en actualización masiva:', error)
        return { success: false, message: 'Error al actualizar precios' }
    }
}

export async function getPriceHistory(clientId?: string) {
    const session = await verifySession()
    if (!session) return null

    const where: any = {
        client: { userId: session.userId }
    }

    if (clientId) {
        where.clientId = clientId
    }

    return db.priceHistory.findMany({
        where,
        include: {
            client: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
    })
}

export async function getPriceChartData() {
    const session = await verifySession()
    if (!session) return null

    // Get price history for last 12 months (Argentina UTC-3)
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const monthStr = twelveMonthsAgo.toISOString().slice(0, 7)

    const history = await db.priceHistory.findMany({
        where: {
            client: { userId: session.userId },
            month: { gte: monthStr }
        },
        orderBy: { month: 'asc' }
    })

    // Group by month and calculate average new price
    const monthlyData = history.reduce((acc: any, record: any) => {
        if (!acc[record.month]) {
            acc[record.month] = { total: 0, count: 0 }
        }
        acc[record.month].total += Number(record.newPrice)
        acc[record.month].count += 1
        return acc
    }, {})

    return Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
        month,
        averagePrice: Math.round(data.total / data.count)
    }))
}
