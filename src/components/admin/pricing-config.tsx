'use client'

import { updateSubscriptionPrice } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface PricingConfigProps {
    currentPrice: number
}

export function PricingConfig({ currentPrice }: PricingConfigProps) {
    const [price, setPrice] = useState(currentPrice)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateSubscriptionPrice(price)
            if (result.success) {
                toast.success('Precio actualizado correctamente')
            } else {
                toast.error(result.message || 'Error al actualizar')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Precio de Suscripción</CardTitle>
                <CardDescription>Define el valor de la suscripción mensual estándar.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label>Precio Mensual (ARS)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                            type="number"
                            className="pl-7"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Este cambio impactará inmediatamente en:
                        <ul className="list-disc ml-4 mt-1">
                            <li>Landing Page (Oferta)</li>
                            <li>Checkout de Mercado Pago</li>
                            <li>Pantalla de renovación</li>
                        </ul>
                    </p>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                </Button>
            </CardFooter>
        </Card>
    )
}
