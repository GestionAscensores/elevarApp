import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CalendarClock, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/session"

export async function PriceAlertsWidget() {
    const session = await verifySession()
    if (!session) return null

    // Fetch clients with frequency (excluding 'MONTHLY' if we treat it as standard flow? Actually plan says include all if due)
    // Optimization: We could filter DB side if possible, but JS filter is fine for now.
    const clients = await db.client.findMany({
        where: { userId: session.userId },
        select: {
            id: true,
            name: true,
            cuit: true,
            priceUpdateFrequency: true,
            lastPriceUpdate: true,
            items: { // Get current price to show?
                take: 1
            }
        }
    })

    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    const dueClients = clients.filter(client => {
        // User requested to ignore MONTHLY updates in the widget
        if (client.priceUpdateFrequency === 'MONTHLY') return false

        if (!client.lastPriceUpdate) return true // Never updated? Maybe due if it's not new? Let's say yes or maybe handle separate logic.
        // Actually if lastPriceUpdate is null, we assume it needs initial setting or update?
        // Let's assume if null, we flag it if created > 1 month ago? 
        // Or simpler: If null, show as "Pendiente Configuración" or just Due.

        let monthsToAdd = 1
        switch (client.priceUpdateFrequency) {
            case 'QUARTERLY': monthsToAdd = 3; break;
            case 'SEMIANNUAL': monthsToAdd = 6; break;
            case 'YEARLY': monthsToAdd = 12; break;
            default: monthsToAdd = 1;
        }

        const nextUpdate = new Date(client.lastPriceUpdate)
        nextUpdate.setMonth(nextUpdate.getMonth() + monthsToAdd)

        // Compare: If nextUpdate is in the past or current month, it's due.
        // We compare YYYY-MM
        const nextDateValue = nextUpdate.getFullYear() * 12 + nextUpdate.getMonth()
        const currentDateValue = currentYear * 12 + currentMonth

        return nextDateValue <= currentDateValue
    })

    if (dueClients.length === 0) return null

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-orange-800">
                    <CalendarClock className="h-5 w-5" />
                    <CardTitle className="text-lg">Actualizaciones de Precio Pendientes</CardTitle>
                </div>
                <CardDescription>
                    {dueClients.length} clientes requieren revisión de precios según su frecuencia pactada.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                        {dueClients.map(client => (
                            <div key={client.id} className="flex items-center justify-between text-sm p-2 bg-white rounded-md border shadow-sm">
                                <div className="grid gap-0.5">
                                    <span className="font-medium">{client.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {client.priceUpdateFrequency === 'QUARTERLY' ? 'Trimestral' :
                                            client.priceUpdateFrequency === 'YEARLY' ? 'Anual' :
                                                client.priceUpdateFrequency === 'SEMIANNUAL' ? 'Semestral' : 'Mensual'}
                                        {' • '}
                                        Última: {client.lastPriceUpdate ? client.lastPriceUpdate.toLocaleDateString('es-AR') : 'Nunca'}
                                    </span>
                                </div>
                                <Button size="sm" variant="outline" className="h-7 text-orange-700 border-orange-200 hover:bg-orange-50" asChild>
                                    <Link href={`/dashboard/clients`}>
                                        Actualizar <ArrowUpRight className="ml-1 h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
