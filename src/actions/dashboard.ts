'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'

export async function getDashboardMetrics() {
    const session = await verifySession()
    if (!session) return null

    const userId = session.userId
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // 1. Total Billed This Month
    const currentMonthInvoices = await db.invoice.aggregate({
        where: {
            userId: userId,
            date: {
                gte: firstDayOfMonth
            },
            status: 'APPROVED'
        },
        _sum: {
            totalAmount: true
        },
        _count: true
    })

    // 2. Active Clients
    const distinctClients = await db.invoice.findMany({
        where: { userId: userId },
        distinct: ['clientId'],
        select: { clientId: true }
    })

    const totalClientsCount = await db.client.count({
        where: { userId: userId }
    })

    // 3. Last 6 Months Revenue for Chart
    // Prisma group by date is tricky with standard API across DBs.
    // We will fetch last 6 months invoices and aggregate in JS for simplicity and DB agnostic.
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const historicalInvoices = await db.invoice.findMany({
        where: {
            userId: userId,
            date: { gte: sixMonthsAgo },
            status: 'APPROVED'
        },
        select: {
            date: true,
            totalAmount: true
        }
    })

    // Group by Month
    const monthlyData = new Map<string, number>()

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = d.toLocaleString('es-AR', { month: 'short' })
        // We might have duplicates if we go over Year boundary with same month name? 
        // Better key: YYYY-MM then format display. 
        // For simplicity: MonthName.
        if (!monthlyData.has(key)) monthlyData.set(key, 0)
    }

    // Sort to fill correctly?
    // Let's create an array of keys in order
    const monthsOrder = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = d.toLocaleString('es-AR', { month: 'short' })
        monthsOrder.push(key)
        if (!monthlyData.has(key)) monthlyData.set(key, 0)
    }

    historicalInvoices.forEach((inv: any) => {
        const key = inv.date.toLocaleString('es-AR', { month: 'short' })
        if (monthlyData.has(key)) {
            monthlyData.set(key, (monthlyData.get(key) || 0) + Number(inv.totalAmount))
        }
    })

    const chartData = monthsOrder.map(month => ({
        name: month,
        total: monthlyData.get(month) || 0
    }))

    // 4. Recent Invoices
    const recentInvoices = await db.invoice.findMany({
        where: { userId: userId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { client: true }
    })

    return {
        totalBilled: Number(currentMonthInvoices._sum.totalAmount || 0),
        invoicesCount: currentMonthInvoices._count,
        totalClients: totalClientsCount, // Or active based on distinct
        activeClients: distinctClients.length,
        chartData,
        recentInvoices
    }
}
