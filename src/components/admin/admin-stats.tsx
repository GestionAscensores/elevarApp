import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Users } from "lucide-react"

interface AdminMetrics {
    totalUsers: number
    trialUsers: number
    activeSubs: number
    verifiedUsers: number
    totalInvoices: number
    totalInvoiceRevenue: number
    platformRevenue: number
    mrr: number
}

export function AdminStats({ metrics }: { metrics: AdminMetrics }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* New: MRR */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">MRR Estimado</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.mrr)}</div>
                    <p className="text-xs text-muted-foreground">
                        {metrics.activeSubs} suscripciones activas
                    </p>
                </CardContent>
            </Card>

            {/* New: Total Revenue */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recaudación Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.platformRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                        Histórico acumulado
                    </p>
                </CardContent>
            </Card>

            {/* Existing: Users */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                    <div className="flex text-xs text-muted-foreground gap-2">
                        <span className="text-green-600 font-medium">{metrics.activeSubs} Activos</span>
                        <span>•</span>
                        <span className="text-orange-600 font-medium">{metrics.trialUsers} Prueba</span>
                    </div>
                </CardContent>
            </Card>

            {/* Existing: Invoices (System Usage) */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Facturas (Clientes)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
                    <p className="text-xs text-muted-foreground">
                        Generadas por usuarios
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
