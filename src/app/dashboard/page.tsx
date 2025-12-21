import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { OverviewChart } from "@/components/dashboard/overview-chart"
// import { TrialBanner } from "@/components/dashboard/trial-banner" // Replaced by Gauge
import { verifySession } from "@/lib/session"
import { db } from "@/lib/db"
import { getDashboardMetrics } from "@/actions/dashboard"
import { getPriceChartData } from "@/actions/pricing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Building, Calculator } from "lucide-react"
import { MonotributoCard } from "@/components/dashboard/monotributo-card"
import { MassUpdatePrices } from "@/components/pricing/mass-update-prices"
import { PriceHistoryChart } from "@/components/pricing/price-history-chart"
import { TrialGauge } from "@/components/dashboard/trial-gauge"

export default async function DashboardPage() {
    const session = await verifySession()

    let subscriptionData = null
    if (session?.userId) {
        // Fetch fresh subscription data
        const user = await db.user.findUnique({
            where: { id: session.userId },
            select: {
                subscriptionStatus: true,
                trialEndsAt: true
            }
        })

        subscriptionData = user

        // Self-healing: If trial but no date, fix it now (15 days)
        if (subscriptionData?.subscriptionStatus === 'trial' && !subscriptionData.trialEndsAt) {
            console.log("Self-fixing missing trial date for user:", session.userId)
            const newDate = new Date()
            newDate.setDate(newDate.getDate() + 15) // 15 days from now

            await db.user.update({
                where: { id: session.userId },
                data: { trialEndsAt: newDate }
            })
            subscriptionData.trialEndsAt = newDate
        }
    }

    const metrics = await getDashboardMetrics()
    const priceData = await getPriceChartData()

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/clients/new">
                            <Building className="mr-2 h-4 w-4" /> Nuevo Edificio
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/billing/budgets/new">
                            <Calculator className="mr-2 h-4 w-4" /> Nuevo Presupuesto
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/billing/new">
                            <Plus className="mr-2 h-4 w-4" /> Nueva Factura
                        </Link>
                    </Button>
                </div>
            </div>

            <DashboardStats />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Trial Gauge - Only show if in trial */}
                {subscriptionData?.subscriptionStatus === 'trial' && subscriptionData?.trialEndsAt && (
                    <TrialGauge trialEndsAt={subscriptionData.trialEndsAt} />
                )}

                <div className={subscriptionData?.subscriptionStatus === 'trial' ? "col-span-full lg:col-span-4" : "col-span-full"}>
                    <MonotributoCard />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Ingresos Mensuales</CardTitle>
                        <CardDescription>Resumen de facturación del último semestre.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {metrics ? <OverviewChart data={metrics.chartData} /> : <p className="text-sm text-muted-foreground p-4">Cargando gráfico...</p>}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Últimas Facturas</CardTitle>
                        <CardDescription>
                            Transacciones recientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {metrics?.recentInvoices.map((inv: any) => (
                                <div className="flex items-center" key={inv.id}>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{inv.client.name}</p>
                                        <div className="text-xs text-muted-foreground">
                                            {inv.client.email || 'Sin email'}
                                        </div>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        +${Number(inv.totalAmount).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                            {(!metrics?.recentInvoices || metrics.recentInvoices.length === 0) && (
                                <p className="text-sm text-muted-foreground">No hay facturas recientes</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sistema de Actualización Masiva de Precios */}
            <div className="grid gap-4 md:grid-cols-2">
                <MassUpdatePrices />
                <PriceHistoryChart data={priceData || []} />
            </div>
        </div >
    )
}
