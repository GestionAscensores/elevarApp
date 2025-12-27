'use client'

import { createSubscriptionPreference } from "@/actions/payments"
import { getSubscriptionPrice } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function SubscriptionPage() {
    const [loading, setLoading] = useState(false)
    const [price, setPrice] = useState<number | null>(null)

    useEffect(() => {
        getSubscriptionPrice().then(setPrice)
    }, [])

    const handleSubscribe = async () => {
        setLoading(true)
        try {
            const result = await createSubscriptionPreference()
            if (result.success && result.url) {
                window.location.href = result.url
            } else {
                toast.error(result.message || 'Error al iniciar el pago')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setLoading(false)
        }
    }

    const formattedPrice = price
        ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price)
        : '...'

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md border-red-200 shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
                        <Lock className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl text-red-700">Suscripción Vencida</CardTitle>
                    <CardDescription>
                        Tu período de prueba ha finalizado. Para continuar utilizando Elevar App, activa tu suscripción mensual.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border text-center">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Plan Mensual</p>
                        <div className="flex items-baseline justify-center gap-1 mt-2">
                            <span className="text-3xl font-bold">{formattedPrice}</span>
                            <span className="text-muted-foreground">/mes</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Acceso completo a facturación y clientes</p>
                    </div>

                    <ul className="text-sm space-y-2 text-gray-600 ml-4 list-disc">
                        <li>Facturación ilimitada con ARCA</li>
                        <li>Gestión de Clientes y Cobranzas</li>
                        <li>Soporte técnico prioritario</li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                        onClick={handleSubscribe}
                        disabled={loading || !price}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Procesando...' : 'Suscribirse con MercadoPago'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
