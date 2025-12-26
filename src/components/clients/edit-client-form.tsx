'use client'

import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import { updateClient } from '@/actions/clients'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button className="ml-auto" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar Cliente
        </Button>
    )
}

const DOC_TYPES = [
    { value: '80', label: 'CUIT' },
    { value: '96', label: 'DNI' },
    { value: '99', label: 'Ninguno' }
]

const IVA_CONDITIONS = [
    "Responsable Inscripto",
    "Monotributo",
    "Exento",
    "Consumidor Final",
    "Sujeto No Categorizado"
]

const EQUIPMENT_TYPES = [
    "Ascensor",
    "Montacargas",
    "Monta camillas",
    "Monta Autos",
    "Monta ataúdes",
    "Rampa",
    "Escalera Mecánica",
    "Otros"
]

const UPDATE_FREQUENCIES = [
    { value: 'MONTHLY', label: 'Mensual' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'SEMIANNUAL', label: 'Semestral' },
    { value: 'YEARLY', label: 'Anual' },
]

type EquipmentItem = {
    id: number
    type: string
    quantity: number
    price: number
}

export function EditClientForm({ client }: { client: any }) {
    const [state, action] = useActionState(updateClient, undefined)
    const router = useRouter()

    const [docType, setDocType] = useState(client.docType || '80')

    // Initialize items from client data or default
    const [items, setItems] = useState<EquipmentItem[]>(
        client.items && client.items.length > 0
            ? client.items.map((i: any) => ({ ...i, id: i.id || Date.now() + Math.random() }))
            : [{ id: Date.now(), type: 'Ascensor', quantity: 1, price: 0 }]
    )

    useEffect(() => {
        if (state?.success) {
            toast.success("Cliente actualizado correctamente")
            router.push('/dashboard/clients')
        } else if (state?.message) {
            toast.error(state.message)
        }
    }, [state, router])

    const addItem = () => {
        setItems([...items, { id: Date.now(), type: 'Ascensor', quantity: 1, price: 0 }])
    }

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const updateItem = (id: number, field: keyof EquipmentItem, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
    }

    const totalAbono = items.reduce((acc, item) => acc + (item.quantity * item.price), 0)

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Editar Cliente</CardTitle>
                <CardDescription>Modifique los datos del cliente.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action} className="space-y-6">
                    <input type="hidden" name="id" value={client.id} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clientNumber">N° de Cliente</Label>
                            <Input id="clientNumber" name="clientNumber" type="number" defaultValue={client.clientNumber || ''} placeholder="Ej: 123" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre / Edificio</Label>
                            <Input id="name" name="name" defaultValue={client.name} required />
                            {state?.errors?.name && <p className="text-sm text-red-500">{state.errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cuit">Documento</Label>
                            <div className="flex gap-2">
                                <div className="w-1/3">
                                    <Select name="docType" value={docType} onValueChange={(v) => setDocType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="80">CUIT</SelectItem>
                                            <SelectItem value="96">DNI</SelectItem>
                                            <SelectItem value="99">S/D</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-2/3">
                                    <Input
                                        id="cuit"
                                        name="cuit"
                                        required={docType !== '99'}
                                        readOnly={docType === '99'}
                                        defaultValue={docType === '99' ? '' : client.cuit}
                                        key={docType}
                                    />
                                </div>
                            </div>
                            {state?.errors?.cuit && <p className="text-sm text-red-500">{state.errors.cuit}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Domicilio Fiscal</Label>
                            <Input id="address" name="address" defaultValue={client.address || ''} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ivaCondition">Condición IVA</Label>
                            <Select name="ivaCondition" defaultValue={client.ivaCondition} required onValueChange={(v) => {
                                const isFormal = ['Responsable Inscripto', 'Monotributo', 'Exento'].includes(v)
                                if (isFormal && docType === '99') {
                                    toast.warning("Para esta condición de IVA, debe ingresar un CUIT.")
                                }
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {IVA_CONDITIONS.map((cond) => (
                                        <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo de la Administración</Label>
                            <Input id="email" name="email" type="email" defaultValue={client.email || ''} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" name="phone" defaultValue={client.phone || ''} placeholder="Ej: 11 1234-5678" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priceUpdateFrequency">Frecuencia Actualización</Label>
                            <Select name="priceUpdateFrequency" defaultValue={client.priceUpdateFrequency || 'MONTHLY'} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {UPDATE_FREQUENCIES.map((freq) => (
                                        <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                                    ))}
                                    <SelectItem value="NO">Sin Actualización</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastPriceUpdate">Última Actualización / Inicio Ciclo</Label>
                            <Input
                                type="date"
                                id="lastPriceUpdate"
                                name="lastPriceUpdate"
                                defaultValue={client.lastPriceUpdate ? new Date(client.lastPriceUpdate).toISOString().split('T')[0] : ''}
                            />
                            <p className="text-xs text-muted-foreground">Fecha base para la próxima alerta.</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Equipos y Abono</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="mr-2 h-4 w-4" /> Agregar Equipo
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-muted/20">
                                    <div className="col-span-12 md:col-span-5 space-y-1">
                                        <Label className="text-xs">Tipo de Equipo</Label>
                                        <Select value={item.type} onValueChange={(v) => updateItem(item.id, 'type', v)}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EQUIPMENT_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-5 md:col-span-2 space-y-1">
                                        <Label className="text-xs">Cant.</Label>
                                        <Input
                                            type="number"
                                            className="h-9"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="col-span-5 md:col-span-4 space-y-1">
                                        <Label className="text-xs">Precio Unitario Abono</Label>
                                        <Input
                                            type="number"
                                            className="h-9"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="col-span-2 md:col-span-1 flex justify-end pb-1">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-right text-lg font-bold">
                            Total Abono: ${totalAbono.toFixed(2)}
                        </div>
                    </div>

                    <input type="hidden" name="items" value={JSON.stringify(items)} />

                    {state?.message && <p className="text-sm text-red-500">{state.message}</p>}

                    <div className="flex justify-end pt-4">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
