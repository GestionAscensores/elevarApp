'use client'

import { useFormStatus, useFormState } from 'react-dom'
import { createProduct } from '@/actions/products'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button className="ml-auto" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Precio
        </Button>
    )
}

export function ProductForm() {
    const [state, action] = useFormState(createProduct, undefined)
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            toast.success("Producto creado correctamente")
        } else if (state?.message) {
            toast.error(state.message) // Show error toast
        }
    }, [state, router])

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Datos del Producto / Servicio</CardTitle>
                <CardDescription>Defina el precio y la moneda.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" name="name" placeholder="Ej. Abono Mantenimiento Ascensor" required />
                            {state?.errors?.name && <p className="text-sm text-red-500">{state.errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Código (Opcional)</Label>
                            <Input id="code" name="code" placeholder="AB-001" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Precio Unitario</Label>
                            <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" required />
                            {state?.errors?.price && <p className="text-sm text-red-500">{state.errors.price}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">Moneda</Label>
                            <Select name="currency" defaultValue="ARS" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                                </SelectContent>
                            </Select>
                            {state?.errors?.currency && <p className="text-sm text-red-500">{state.errors.currency}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ivaRate">Alícuota IVA</Label>
                            <Select name="ivaRate" defaultValue="21">
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="21">21%</SelectItem>
                                    <SelectItem value="10.5">10.5%</SelectItem>
                                    <SelectItem value="0">0%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Descripción (Opcional)</Label>
                            <Textarea id="description" name="description" placeholder="Detalles del servicio..." />
                        </div>
                    </div>

                    {state?.message && <p className="text-sm text-red-500">{state.message}</p>}

                    <div className="flex justify-end">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
