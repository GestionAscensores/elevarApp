'use client'

import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import { createMassInvoices } from '@/actions/billing-mass'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

function SubmitButton({ count }: { count: number }) {
    const { pending } = useFormStatus()

    return (
        <Button className="ml-auto" type="submit" disabled={pending || count === 0}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generar {count} Factura(s)
        </Button>
    )
}


import { Switch } from "@/components/ui/switch"

type Props = {
    clients: any[]
}

export function MassInvoiceForm({ clients }: Props) {
    const [state, action] = useActionState(createMassInvoices, undefined)
    const router = useRouter()
    const [selectedClients, setSelectedClients] = useState<string[]>([])

    // Single Item Config
    const [description, setDescription] = useState('Abono Mantenimiento')
    const [price, setPrice] = useState(0)
    const [ivaRate, setIvaRate] = useState('0')

    // Month Selection (YYYY-MM), default Previous Month
    const [month, setMonth] = useState(() => {
        const d = new Date()
        d.setMonth(d.getMonth() - 1)
        return d.toISOString().slice(0, 7)
    })

    const getMonthName = (yyyy_mm: string) => {
        if (!yyyy_mm) return ''
        const [y, m] = yyyy_mm.split('-').map(Number)
        // Use Middle of month to stay safe from timezones
        const date = new Date(y, m - 1, 15)
        const name = date.toLocaleString('es-AR', { month: 'long' })
        return name.charAt(0).toUpperCase() + name.slice(1)
    }

    const monthName = getMonthName(month)

    // New Feature: Use Client Fee
    const [useClientFee, setUseClientFee] = useState(false)

    useEffect(() => {
        if (state?.success) {
            toast.success(state.message)
            router.push('/dashboard/billing')
        } else if (state?.message) {
            toast.error(state.message)
            if (state.errors && state.errors.length > 0) {
                state.errors.forEach((err: string) => toast.error(err))
            }
        }
    }, [state, router])

    const toggleClient = (id: string) => {
        if (selectedClients.includes(id)) {
            setSelectedClients(selectedClients.filter(c => c !== id))
        } else {
            setSelectedClients([...selectedClients, id])
        }
    }

    const toggleAll = () => {
        if (selectedClients.length === clients.length) {
            setSelectedClients([])
        } else {
            setSelectedClients(clients.map(c => c.id))
        }
    }

    // Construct items JSON for the action
    const itemsJson = JSON.stringify([{
        productId: null,
        // "Abono Mantenimiento - Diciembre"
        description: `${description} - ${monthName}`,
        quantity: 1, // Default 1 for mass
        price, // Will be ignored by backend if useClientFee is true
        ivaRate
    }])

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Seleccionar Clientes</CardTitle>
                        <CardDescription>Facturar a múltiples clientes a la vez.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border max-h-[500px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={clients.length > 0 && selectedClients.length === clients.length}
                                                onCheckedChange={toggleAll}
                                            />
                                        </TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>CUIT</TableHead>
                                        <TableHead className="text-right">Abono Actual</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.map(client => (
                                        <TableRow key={client.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedClients.includes(client.id)}
                                                    onCheckedChange={() => toggleClient(client.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{client.name}</TableCell>
                                            <TableCell>{client.cuit}</TableCell>
                                            <TableCell className="text-right">
                                                {client.items && client.items.length > 0
                                                    ? `$${client.items.reduce((acc: number, i: any) => acc + (i.quantity * i.price), 0).toFixed(2)}`
                                                    : '$0.00'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalle del Concepto</CardTitle>
                        <CardDescription>Configurar qué se va a facturar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <form action={action} className="space-y-4">
                                <input type="hidden" name="clientIds" value={JSON.stringify(selectedClients)} />
                                <input type="hidden" name="items" value={itemsJson} />

                                {/* Switch to enable client fee */}
                                <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
                                    <Switch
                                        id="use-fee"
                                        checked={useClientFee}
                                        onCheckedChange={setUseClientFee}
                                        name="useClientFee"
                                    />
                                    <Label htmlFor="use-fee" className="cursor-pointer">Usar precio de Abono</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label>Descripción Base</Label>
                                    <Input value={description} onChange={e => setDescription(e.target.value)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Mes a Facturar</Label>
                                    <Input
                                        type="month"
                                        name="date"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Se facturará: <strong>{description} correspondiente al mes de {monthName}</strong>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Precio Unitario</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={useClientFee ? 0 : price}
                                        onChange={e => setPrice(Number(e.target.value))}
                                        disabled={useClientFee}
                                        placeholder={useClientFee ? "Variable según cliente" : "0.00"}
                                        className={useClientFee ? "bg-muted text-muted-foreground" : ""}
                                    />
                                    {useClientFee && <p className="text-xs text-muted-foreground">Se tomará el abono de cada cliente.</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Alicuota IVA</Label>
                                    <Select value={ivaRate} onValueChange={setIvaRate}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="21">21%</SelectItem>
                                            <SelectItem value="10.5">10.5%</SelectItem>
                                            <SelectItem value="0">0%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-4">
                                    <SubmitButton count={selectedClients.length} />
                                </div>
                            </form>

                            <hr className="my-2 border-dashed" />

                            <AutoBillingSchedulerDialog
                                selectedClients={selectedClients}
                                totalClients={clients.length}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { updateAutoBillingConfig } from '@/actions/billing-mass'

function AutoBillingSchedulerDialog({ selectedClients, totalClients }: { selectedClients: string[], totalClients: number }) {
    const [open, setOpen] = useState(false)
    const [autoBillingEnabled, setAutoBillingEnabled] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin hidden" />
                    Programar Recurrencia Automática
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Programar Facturación Automática</DialogTitle>
                    <DialogDescription>
                        El sistema generará borradores automáticamente todos los meses para los clientes seleccionados.
                    </DialogDescription>
                </DialogHeader>

                <form action={async (formData) => {
                    formData.append('selectedClients', JSON.stringify(selectedClients))
                    const res = await updateAutoBillingConfig(formData)
                    if (res.success) {
                        toast.success('Configuración guardada')
                        setOpen(false)
                    } else {
                        toast.error(res.message || 'Error al guardar')
                    }
                }} className="space-y-4 py-4">

                    <div className="flex items-center justify-between border p-3 rounded-md bg-muted/20">
                        <div className="space-y-0.5">
                            <Label htmlFor="autoBillingEnabled" className="text-base">Activar Automático</Label>
                            <p className="text-xs text-muted-foreground">
                                Generar cada mes.
                            </p>
                        </div>
                        <Switch
                            id="autoBillingEnabled"
                            name="autoBillingEnabled"
                            defaultChecked={false}
                        />
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="autoBillingDay">Día de Generación</Label>
                        <Select name="autoBillingDay" defaultValue="1">
                            <SelectTrigger>
                                <SelectValue placeholder="Día del mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                    <SelectItem key={day} value={String(day)}>Día {day}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Se generarán borradores correspondientes al <strong>mes anterior</strong>.</p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800">
                        <p className="font-semibold mb-1">Clientes Destino:</p>
                        <ul className="list-disc list-inside">
                            <li>Se activará para: <strong>{selectedClients.length} clientes seleccionados</strong>.</li>
                            <li>Se desactivará para: <strong>{totalClients - selectedClients.length} clientes no seleccionados</strong>.</li>
                        </ul>
                        <p className="mt-2 text-xs">Esta acción actualizará la preferencia de "Incluir en masiva" de cada cliente.</p>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost" type="button">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit">Guardar Programación</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

