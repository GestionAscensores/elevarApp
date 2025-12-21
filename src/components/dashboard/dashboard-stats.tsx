
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Users, FileText, Activity } from 'lucide-react'

export async function DashboardStats() {
    const session = await verifySession()
    if (!session) return null

    const userId = session.userId

    // Current Month Range
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

    // Stats
    const totalClients = await db.client.count({ where: { userId } })

    const totalInvoices = await db.invoice.count({
        where: { userId, status: 'APPROVED' }
    })

    const monthlyInvoices = await db.invoice.count({
        where: {
            userId,
            status: 'APPROVED',
            date: { gte: firstDay }
        }
    })

    const monthlyRevenueAgg = await db.invoice.aggregate({
        where: {
            userId,
            status: 'APPROVED',
            date: { gte: firstDay }
        },
        _sum: { totalAmount: true }
    })

    const monthlyRevenue = monthlyRevenueAgg._sum.totalAmount?.toNumber() || 0

    // 5. Total Equipment Count
    // We need to join with Client to filter by userId
    const totalEquipment = await db.clientEquipment.aggregate({
        where: {
            client: {
                userId: userId
            }
        },
        _sum: {
            quantity: true
        }
    })

    // 6. Theoretical Monthly Revenue
    // Sum of price * quantity for all equipment
    // Prisma aggregate doesn't support multiplication directly in sum?
    // We might need to fetch and calculate or use raw query.
    // Fetching is safer for now if dataset isn't huge.
    const allEquipment = await db.clientEquipment.findMany({
        where: {
            client: {
                userId: userId
            }
        },
        select: {
            price: true,
            quantity: true
        }
    })

    const theoreticalRevenue = allEquipment.reduce((acc, item) => {
        return acc + (Number(item.price) * item.quantity)
    }, 0)

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Facturado este Mes</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${monthlyRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Emitidas este mes</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ing. Mensual estimado (por abonos)</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${theoreticalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Suma de abonos activos</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Equipos Mantenidos</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalEquipment._sum.quantity || 0}</div>
                    <p className="text-xs text-muted-foreground">Unidades totales</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalClients}</div>
                    <p className="text-xs text-muted-foreground">Empresas/Consorcios</p>
                </CardContent>
            </Card>
        </div>
    )
}
