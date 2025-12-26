import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { OverviewChart } from "@/components/dashboard/overview-chart"
// import { TrialBanner } from "@/components/dashboard/trial-banner" // Replaced by Gauge
import { verifySession } from "@/lib/session"
import { db } from "@/lib/db"
import { getDashboardMetrics } from "@/actions/dashboard"
import { getPriceChartData } from "@/actions/pricing"
import { getPendingTasks } from "@/actions/tasks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Building, Calculator } from "lucide-react"
import { MonotributoCard } from "@/components/dashboard/monotributo-card"
import { MassUpdatePrices } from "@/components/pricing/mass-update-prices"
import { PriceHistoryChart } from "@/components/pricing/price-history-chart"
import { TrialGauge } from "@/components/dashboard/trial-gauge"


import { AutoBillingNotifier } from "@/components/dashboard/auto-billing-notifier"
import { PendingDraftsAlert } from "@/components/dashboard/pending-drafts-alert"
import { PriceAlertsWidget } from "@/components/dashboard/price-alerts-widget"
import { PendingTasksWidget } from "@/components/dashboard/pending-tasks-widget"

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
    const pendingTasks = await getPendingTasks()

    return (
        <div className="space-y-4 md:space-y-6">
            <AutoBillingNotifier />
            <PendingDraftsAlert count={metrics?.pendingDrafts || 0} />
            <PriceAlertsWidget />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="grid grid-cols-2 md:flex md:items-center gap-2">
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white w-full md:w-auto text-xs md:text-sm h-12 md:h-10" asChild>
                        <Link href="/dashboard/billing/new">
                            <Plus className="mr-1 md:mr-2 h-4 w-4" /> Nueva Factura
                        </Link>
                    </Button>
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white w-full md:w-auto text-xs md:text-sm h-12 md:h-10" asChild>
                        <Link href="/dashboard/billing/new?type=quote">
                            <Plus className="mr-1 md:mr-2 h-4 w-4" /> Presupuesto
                        </Link>
                    </Button>
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white col-span-2 md:col-span-1 w-full md:w-auto text-xs md:text-sm h-12 md:h-10" asChild>
                        <Link href="/dashboard/clients/new">
                            <Plus className="mr-1 md:mr-2 h-4 w-4" /> Nuevo Edificio
                        </Link>
                    </Button>
                </div>
            </div>

            <DashboardStats />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 w-full">
                {/* Trial Gauge - Only show if in trial */}
                {subscriptionData?.subscriptionStatus === 'trial' && subscriptionData?.trialEndsAt && (
                    <TrialGauge trialEndsAt={subscriptionData.trialEndsAt} />
                )}

                {/* Pending Tasks Widget (Takes remaining space or dedicated if gauge is hidden) */}
                <PendingTasksWidget tasks={pendingTasks} />

                {/* Monotributo Card */}
                <div className={subscriptionData?.subscriptionStatus === 'trial' ? "col-span-full lg:col-span-4 md:col-span-2 block" : "col-span-full lg:col-span-4 block"}>
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
