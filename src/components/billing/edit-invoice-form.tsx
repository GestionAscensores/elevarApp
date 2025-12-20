'use client'

import { useFormStatus, useFormState } from 'react-dom'
import { updateInvoice } from '@/actions/billing'
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
        <Button className="ml-auto w-full md:w-auto" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar Borrador
        </Button>
    )
}

type InvoiceItem = {
    id: number
    productId: string
    description: string
    quantity: number
    price: number
    ivaRate: string
}

export function EditInvoiceForm({ invoice, products }: { invoice: any, products: any[] }) {
    const [state, action] = useFormState(updateInvoice, undefined)
    const router = useRouter()

    const [items, setItems] = useState<InvoiceItem[]>(
        invoice.items.length > 0
            ? invoice.items.map((i: any) => ({
                id: Math.random(),
                productId: i.productId || 'custom',
                description: i.description,
                quantity: Number(i.quantity),
                price: Number(i.unitPrice),
                ivaRate: String(Number(i.ivaRate))
            }))
            : [{ id: 1, productId: '', description: '', quantity: 1, price: 0, ivaRate: '0' }]
    )

    useEffect(() => {
        if (state?.success) {
            toast.success("Borrador actualizado correctamente")

            // Redirect based on type/status
            if (invoice.status === 'QUOTE') {
                router.push('/dashboard/billing/budgets')
            } else if (invoice.type?.startsWith('NC')) {
                router.push('/dashboard/billing/credit-notes')
            } else {
                router.push('/dashboard/billing/invoices')
            }
            router.refresh()
        } else if (state?.message) {
            toast.error(state.message)
        }
    }, [state, router, invoice.status, invoice.type])

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', description: '', quantity: 1, price: 0, ivaRate: '0' }])
    }

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const updateItem = (id: number, field: keyof InvoiceItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value }

                if (field === 'productId') {
                    const prod = products.find(p => p.id === value)
                    if (prod) {
                        updated.description = prod.name
                        updated.price = Number(prod.price)
                    }
                }
                return updated
            }
            return item
        }))
    }

    // Recalculate local total for display
    let total = 0
    items.forEach(item => {
        const sub = item.quantity * item.price
        const rate = Number(item.ivaRate)
        const iva = sub * (rate / 100)
        // If Type C, only subtotal counts towards total effectively for user view logic (Neto)
        // BUT Invoice has Total = Neto + IVA always.
        // If Invoice is C, IVA is 0. So simple sum.
        // If Invoice is A/B, we add IVA.
        if (invoice.type === 'C') {
            total += sub
        } else {
            total += sub + iva
        }
    })

    // Determinar título según tipo de documento
    const getDocumentTitle = () => {
        // Si es QUOTE status, es un presupuesto
        if (invoice.status === 'QUOTE') return 'Editar Presupuesto'
        // Si el type contiene NC o CREDIT, es nota de crédito
        if (invoice.type?.includes('NC') || invoice.type?.includes('CREDIT')) return 'Editar Nota de Crédito'
        // Si no, es una factura
        return 'Editar Factura'
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>{getDocumentTitle()}</CardTitle>
                <CardDescription>Cliente: {invoice.client.name}</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action} className="space-y-6">
                    <input type="hidden" name="id" value={invoice.id} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {invoice.relatedInvoice && (
                            <div className="space-y-2 md:col-span-2">
                                <Label>Comprobante Asociado</Label>
                                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted text-sm">
                                    <span className="font-semibold text-primary">
                                        Factura {invoice.relatedInvoice.type}
                                    </span>
                                    <span>
                                        {String(invoice.relatedInvoice.pointOfSale).padStart(4, '0')}-
                                        {String(invoice.relatedInvoice.number).padStart(8, '0')}
                                    </span>
                                    <span className='ml-auto text-muted-foreground text-xs'>
                                        (Ref. ARCA: {invoice.relatedInvoice.cae || 'Sin CAE'})
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Condición de Pago</Label>
                            <Select name="paymentCondition" defaultValue={invoice.paymentCondition || "Transferencia"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Contado">Contado</SelectItem>
                                    <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                                    <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                                    <SelectItem value="Depósito">Depósito</SelectItem>
                                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {invoice.concept !== 1 && (
                            <>
                                <div className="space-y-2">
                                    <Label>Inicio Servicio</Label>
                                    <Input type="date" name="serviceFrom" defaultValue={invoice.serviceFrom ? new Date(invoice.serviceFrom).toISOString().split('T')[0] : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fin Servicio</Label>
                                    <Input type="date" name="serviceTo" defaultValue={invoice.serviceTo ? new Date(invoice.serviceTo).toISOString().split('T')[0] : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vencimiento Pago</Label>
                                    <Input type="date" name="paymentDue" defaultValue={invoice.paymentDue ? new Date(invoice.paymentDue).toISOString().split('T')[0] : ''} />
                                </div>
                            </>
                        )}
                    </div>
                    <input type="hidden" name="concept" value={invoice.concept} />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Ítems</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="mr-2 h-4 w-4" /> Agregar Ítem
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-end border p-4 rounded-lg bg-muted/20">
                                    <div className="col-span-12 md:col-span-3 space-y-1">
                                        <Label className="text-xs">Producto</Label>
                                        <Select value={item.productId} onValueChange={(v) => updateItem(item.id, 'productId', v)}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Seleccione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="custom">-- Personalizado --</SelectItem>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-12 md:col-span-4 space-y-1">
                                        <Label className="text-xs">Descripción</Label>
                                        <Input
                                            className="h-8"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                        />
                                    </div>

                                    <div className="col-span-6 md:col-span-1 space-y-1">
                                        <Label className="text-xs">Cant.</Label>
                                        <Input
                                            type="number"
                                            className="h-8"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="col-span-6 md:col-span-2 space-y-1">
                                        <Label className="text-xs">Precio U.</Label>
                                        <Input
                                            type="number"
                                            className="h-8"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="col-span-6 md:col-span-1 space-y-1">
                                        <Label className="text-xs">IVA</Label>
                                        <Select value={item.ivaRate} onValueChange={(v) => updateItem(item.id, 'ivaRate', v)}>
                                            <SelectTrigger className="h-8 p-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="21">21%</SelectItem>
                                                <SelectItem value="10.5">10.5%</SelectItem>
                                                <SelectItem value="0">0%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-6 md:col-span-1 flex justify-end">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 items-center">
                        <div className="text-right">
                            <p className="text-muted-foreground text-sm">Total Estimado</p>
                            <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                        </div>
                    </div>

                    <input type="hidden" name="items" value={JSON.stringify(items)} />

                    <div className="flex justify-end pt-4 border-t">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
