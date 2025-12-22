
'use client'

import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import { updateProduct } from '@/actions/products'
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
            Actualizar Precio
        </Button>
    )
}

type Props = {
    product: any
}

export function EditProductForm({ product }: Props) {
    const updateAction = updateProduct.bind(null, product.id)
    const [state, action] = useActionState(updateAction, undefined)
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            toast.success("Producto actualizado correctamente")
            router.push('/dashboard/pricing')
        } else if (state?.message) {
            toast.error(state.message)
        }
    }, [state, router])

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Editar Producto</CardTitle>
                <CardDescription>Modificar datos del servicio.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" name="name" defaultValue={product.name} required />
                            {state?.errors?.name && <p className="text-sm text-red-500">{state.errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Código (Opcional)</Label>
                            <Input id="code" name="code" defaultValue={product.code || ''} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Precio Unitario</Label>
                            <Input id="price" name="price" type="number" step="0.01" defaultValue={Number(product.price)} required />
                            {state?.errors?.price && <p className="text-sm text-red-500">{state.errors.price}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">Moneda</Label>
                            <Select name="currency" defaultValue={product.currency} required>
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

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Descripción (Opcional)</Label>
                            <Textarea id="description" name="description" defaultValue={product.description || ''} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
