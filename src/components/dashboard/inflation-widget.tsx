import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TrendingUp, Info } from "lucide-react"
import { getIndecInflation } from "@/actions/external"

export async function InflationWidget() {
    // Correctly await the server action
    const data = await getIndecInflation()

    // Since we handle errors in the action with a fallback, data should rarely be null.
    // But if it is, we show a graceful error.
    if (!data) {
        return (
            <Card className="col-span-full md:col-span-2 lg:col-span-2 border-red-200 shadow-sm relative overflow-hidden group bg-red-50/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Inflación
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-4">
                    <span className="text-xl font-bold text-red-400">Offline</span>
                </CardContent>
            </Card>
        )
    }

    // Determine color based on value (Just for fun UI touch)
    // > 10% red, > 5% orange, < 5% blue
    const themeColor = data.value > 10 ? 'red' : (data.value > 5 ? 'orange' : 'blue')
    const borderColor = `border-${themeColor}-200`
    const textColor = `text-${themeColor}-600`
    const bgGradient = `from-${themeColor}-50/50 via-white to-gray-50/20`

    // Format date "2024-11-01" -> "Noviembre 2024"
    const dateObj = new Date(data.date)
    const monthName = dateObj.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    const displayMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    return (
        <Card className={`col-span-full md:col-span-2 lg:col-span-2 ${borderColor} shadow-sm relative overflow-hidden group border`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} />

            <CardHeader className="pb-2 relative relative z-10">
                <div className="flex justify-between items-start">
                    <CardTitle className={`text-sm font-medium flex items-center gap-2 text-slate-800`}>
                        <TrendingUp className={`h-4 w-4 ${textColor}`} /> Inflación (IPC)
                    </CardTitle>
                    <div className="bg-white/80 backdrop-blur text-slate-600 text-[10px] px-1.5 py-0.5 rounded border shadow-sm font-medium">
                        MENSUAL
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative z-10 text-center py-4">
                <div className="flex flex-col items-center justify-center">
                    <span className={`text-4xl font-extrabold ${textColor} tracking-tight`}>
                        {data.value.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground font-medium mt-1">
                        {displayMonth}
                    </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                    <Info className="h-3 w-3" />
                    {data.error ? "Datos estimados (Oficial Offline)" : "Fuente: INDEC Oficial"}
                </div>
            </CardContent>
        </Card>
    )
}
