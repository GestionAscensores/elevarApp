'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReceipt } from '@/actions/receipts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CreateReceiptFormProps {
    clients: { id: string; name: string }[]
}

export function CreateReceiptForm({ clients }: CreateReceiptFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [clientId, setClientId] = useState('')
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [description, getDescription] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!clientId || !amount || !date) {
            toast.error('Complete los campos obligatorios')
            return
        }

        setLoading(true)
        try {
            const result = await createReceipt({
                clientId,
                date: new Date(date),
                totalAmount: Number(amount),
                description
            })

            if (result.success) {
                toast.success('Recibo creado exitosamente')
                router.push('/dashboard/receipts')
            } else {
                toast.error(result.message || 'Error al crear')
            }
        } catch (error) {
            toast.error('Error inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Nuevo Recibo</CardTitle>
                <CardDescription>Generar un comprobante de pago X.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Cliente</Label>
                        <Select onValueChange={setClientId} value={clientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Monto</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-7"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Concepto / Descripción</Label>
                        <Input
                            placeholder="Ej. Cobro de Abono Mensual"
                            value={description}
                            onChange={e => getDescription(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generar Recibo
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
