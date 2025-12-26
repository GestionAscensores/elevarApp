'use client'

import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import { handleInvoiceAction } from '@/actions/billing'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, FileText, Loader2 } from "lucide-react"
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { CreateProductDialog } from '@/components/products/create-product-dialog'

function FormButtons() {
    const { pending } = useFormStatus()
    return (
        <div className="flex flex-col sm:flex-row w-full justify-end gap-3">
            <Button variant="outline" type="submit" name="_action" value="save_quote" disabled={pending} className="w-full sm:w-auto">
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!pending && <FileText className="mr-2 h-4 w-4" />}
                Guardar Presupuesto
            </Button>
            <Button variant="outline" type="submit" name="_action" value="save_draft" disabled={pending} className="w-full sm:w-auto">
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Borrador
            </Button>
            <Button type="submit" name="_action" value="emit" disabled={pending} className="w-full sm:w-auto">
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Emitir Factura
            </Button>
        </div>
    )
}

type Props = {
    clients: any[]
    products: any[]
    isQuote?: boolean
    initialData?: {
        clientId: string
        type: string
        paymentCondition: string
        paymentDue: Date | null
        items: any[]
    }
}

type InvoiceItem = {
    id: number
    productId: string
    description: string
    quantity: number
    price: number
    ivaRate: string
}

export function InvoiceForm({ clients, products, isQuote, initialData }: Props) {
    const [state, action] = useActionState(handleInvoiceAction, undefined)
    const router = useRouter()
    const [items, setItems] = useState<InvoiceItem[]>(() => {
        if (initialData?.items && initialData.items.length > 0) {
            return initialData.items.map((i, index) => ({ ...i, id: Date.now() + index }))
        }
        return [{ id: 1, productId: '', description: '', quantity: 1, price: 0, ivaRate: '0' }]
    })

    const [localProducts, setLocalProducts] = useState(products)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [creatingForItemId, setCreatingForItemId] = useState<number | null>(null)

    // Default Values
    const defaultClientId = initialData?.clientId || ''
    const defaultType = initialData?.type || 'C'
    const defaultPaymentCondition = initialData?.paymentCondition || 'Transferencia'
    // Ensure date format is YYYY-MM-DD
    const defaultDate = initialData?.paymentDue
        ? new Date(initialData.paymentDue).toISOString().split('T')[0]
        : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

    useEffect(() => {
        if (state?.success) {
            toast.success((state as any).successMessage || "Operación exitosa")
            if (isQuote) {
                router.push('/dashboard/billing/budgets')
            } else {
                router.push('/dashboard/billing')
            }
            router.refresh()
        } else if (state?.message) {
            toast.error(state.message)
        }
    }, [state, router, isQuote])

    // ... existing addItem/removeItem ...
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
                // Handle "Create New" selection
                if (field === 'productId' && value === 'create_new') {
                    setCreatingForItemId(id)
                    setCreateDialogOpen(true)
                    return item // Don't change val yet
                }

                const updated = { ...item, [field]: value }

                // Auto-fill from product
                if (field === 'productId') {
                    const prod = localProducts.find(p => p.id === value)
                    if (prod) {
                        // updated.description = prod.name // Removed per user request
                        updated.price = prod.price
                    }
                }
                return updated
            }
            return item
        }))
    }

    const handleProductCreated = (newProduct: any) => {
        setLocalProducts(prev => [newProduct, ...prev])

        // Use setTimeout to ensure the Select content re-renders with the new option 
        // before we try to select it.
        setTimeout(() => {
            if (creatingForItemId) {
                setItems(currentItems => currentItems.map(item => {
                    if (item.id === creatingForItemId) {
                        return {
                            ...item,
                            productId: newProduct.id,
                            description: item.description,
                            price: newProduct.price,
                            ivaRate: newProduct.ivaRate || '21'
                        }
                    }
                    return item
                }))
            }
            setCreatingForItemId(null)
        }, 0)
    }

    const total = items.reduce((acc, item) => acc + (item.quantity * item.price), 0)

    // Concatenate Product Name + Description for submission
    const submitItems = items.map(item => {
        if (!item.productId || item.productId === 'custom' || item.productId === 'create_new') {
            return item
        }
        const prod = localProducts.find(p => p.id === item.productId)
        if (!prod) return item

        const finalDesc = item.description
            ? `${prod.name} ${item.description}`
            : prod.name

        return {
            ...item,
            description: finalDesc
        }
    })

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>{isQuote ? 'Nuevo Presupuesto' : 'Nueva Factura'}</CardTitle>
                <CardDescription>
                    {isQuote ? 'Crear un nuevo presupuesto para el cliente.' : 'Emitir un nuevo comprobante electrónico.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de Comprobante</Label>
                            <Select name="type" defaultValue={defaultType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="C">Factura C</SelectItem>
                                    <SelectItem value="A">Factura A</SelectItem>
                                    <SelectItem value="B">Factura B</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <Select name="clientId" required defaultValue={defaultClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un cliente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.cuit})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Condición de Pago</Label>
                            <Select name="paymentCondition" defaultValue={defaultPaymentCondition}>
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

                        <div className="space-y-2">
                            <Label>Vencimiento Pago</Label>
                            <Input
                                type="date"
                                name="paymentDue"
                                defaultValue={defaultDate}
                            />
                        </div>
                    </div>

                    <Separator />

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
                                    <div className="col-span-12 md:col-span-3 space-y-1 relative">
                                        <Label className="text-xs">Producto</Label>
                                        <Select value={item.productId} onValueChange={(v) => updateItem(item.id, 'productId', v)}>
                                            <SelectTrigger className="h-8 w-full overflow-hidden">
                                                <SelectValue placeholder="Seleccione..." className="truncate" />
                                            </SelectTrigger>
                                            <SelectContent className="max-w-[400px]">
                                                <SelectItem value="custom">-- Personalizado --</SelectItem>
                                                <SelectItem value="create_new" className="font-medium text-blue-600 dark:text-blue-400">
                                                    + Crear nuevo producto...
                                                </SelectItem>
                                                {localProducts.map(p => (
                                                    <SelectItem key={p.id} value={p.id} className="truncate">
                                                        {p.name}
                                                    </SelectItem>
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

                    <input type="hidden" name="items" value={JSON.stringify(submitItems)} />

                    <div className="flex justify-end pt-4 border-t">
                        <FormButtons />
                    </div>
                </form>
            </CardContent>

            <CreateProductDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onProductCreated={handleProductCreated}
            />
        </Card>
    )
}
