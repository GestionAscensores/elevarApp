'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TrendingUp, Info, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function InflationWidget() {
    const [data, setData] = useState<{ date: string, value: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch directly from client browser to avoid Vercel IP blocks
                const res = await fetch('https://apis.datos.gob.ar/series/api/series/?ids=145.3_INGNACUAL_DICI_M_38&limit=1&sort=-indice_tiempo&format=json')
                if (!res.ok) throw new Error('Network error')

                const json = await res.json()
                if (json.data && json.data.length > 0) {
                    const [date, value] = json.data[0]
                    setData({ date, value: Number(value) })
                } else {
                    setError(true)
                }
            } catch (e) {
                console.error("Client Fetch Error:", e)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <Card className="col-span-full md:col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Inflación (IPC)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
            </Card>
        )
    }

    if (error || !data) {
        return (
            <Card className="col-span-full md:col-span-2 lg:col-span-2 border-red-200 shadow-sm relative overflow-hidden group bg-red-50/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Inflación
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-4">
                    <span className="text-xl font-bold text-red-400">Error</span>
                    <p className="text-xs text-red-400 mt-1">No se pudo cargar</p>
                </CardContent>
            </Card>
        )
    }

    // Format date "2024-11-01" -> "Noviembre 2024"
    const dateObj = new Date(data.date)
    // Fix timezone offset for display if needed, but usually 'date' string is ISO date part.
    // Ensure accurate month display by treating as UTC or appending time
    const monthName = dateObj.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    const displayMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    return (
        <Card className="col-span-full md:col-span-2 lg:col-span-2 border-blue-200 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/20" />

            <CardHeader className="pb-2 relative relative z-10">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Inflación Mensual
                    </CardTitle>
                    <div className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        OFICIAL
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative z-10 text-center py-4">
                <div className="flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-blue-600 tracking-tight">
                        {data.value.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground font-medium mt-1">
                        {displayMonth}
                    </span>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-center gap-1.5 text-[10px] text-blue-400">
                    <Info className="h-3 w-3" />
                    Fuente: INDEC (API Series de Tiempo)
                </div>
            </CardContent>
        </Card>
    )
}
