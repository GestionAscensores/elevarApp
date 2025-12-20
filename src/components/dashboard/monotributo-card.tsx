'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getMonotributoStatus } from '@/actions/monotributo'
import { syncHistoricalData } from '@/actions/sync'
import { AlertCircle, TrendingUp, Info, Download } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function MonotributoCard() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        getMonotributoStatus().then((result) => {
            setData(result)
            setLoading(false)
        })
    }, [])

    const handleSync = async () => {
        setSyncing(true)
        try {
            // Sync Factura C (Type 11) - most common for elevator services
            const result = await syncHistoricalData(11)
            if (result.success) {
                toast.success(result.message || 'Sincronización completada')
                // Refresh data
                const newData = await getMonotributoStatus()
                setData(newData)
            } else {
                toast.error(result.message || 'Error al sincronizar')
            }
        } catch (error: any) {
            toast.error('Error: ' + error.message)
        } finally {
            setSyncing(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Estado Monotributo</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-[100px] mb-2" />
                    <Skeleton className="h-4 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!data) return null;

    const { grossRevenue, currentCategoryCode, nextCategoryLimit, serviceLimit, isExcluded, nextCategoryCode } = data

    // Determine target limit to show progress against
    // If not excluded, aim for Next Category Limit. 
    // If H is max for services, and we are G, aim for H.
    // If H, aim for... exclusion limit? 
    // Let's use logic:
    // If strictly services, limit is serviceLimit (Category H).
    // If current is H, next limit is Excluded (or same H limit to show danger).

    // We can simplify: Always show consumption of the NEXT limit.
    const targetLimit = nextCategoryLimit || serviceLimit // Fallback to service limit if at top (K or H depending on logic)

    const percentage = Math.min(100, (grossRevenue / targetLimit) * 100)

    // Formatting
    const formatMoney = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val)

    // Color Logic
    let progressColor = "bg-green-500"
    let statusText = "Estás dentro de los parámetros."
    let statusColor = "text-muted-foreground"

    if (percentage > 80) {
        progressColor = "bg-yellow-500"
        statusText = "Atención: Te acercas al límite de la categoría."
        statusColor = "text-yellow-600"
    }
    if (percentage > 95 || isExcluded) {
        progressColor = "bg-red-500"
        statusText = "PELIGRO: Estás al borde o excedido de la categoría."
        statusColor = "text-red-600 font-bold"
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado Monotributo</CardTitle>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSync}
                        disabled={syncing}
                        className="h-8 px-2"
                    >
                        <Download className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        <span className="ml-1 text-xs">Sincronizar</span>
                    </Button>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between mb-1">
                    <div className="text-2xl font-bold">Cat. {currentCategoryCode}</div>
                    <div className="text-sm text-muted-foreground text-right w-1/2">
                        {formatMoney(grossRevenue)} / año
                    </div>
                </div>

                <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span>Consumo de Categoría ({percentage.toFixed(1)}%)</span>
                        <span className="text-muted-foreground">Límite: {formatMoney(targetLimit)}</span>
                    </div>
                    {/* Custom Progress Color trick if 'Progress' component doesn't support color prop easily without className overrides */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={`h-full ${progressColor} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>

                <div className={`mt-3 flex items-start gap-2 text-xs ${statusColor}`}>
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p>{statusText}</p>
                </div>

                {nextCategoryCode && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Siguiente salto: <strong>Cat. {nextCategoryCode}</strong>
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
