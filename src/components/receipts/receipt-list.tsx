'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trash2, FileText, Plus } from 'lucide-react'
import { deleteReceipt } from '@/actions/receipts'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ReceiptListProps {
    receipts: any[]
}

export function ReceiptList({ receipts }: ReceiptListProps) {
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este recibo?')) return
        const res = await deleteReceipt(id)
        if (res.success) {
            toast.success('Recibo eliminado')
        } else {
            toast.error('Error al eliminar')
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recibos Emitidos</CardTitle>
                    <CardDescription>Gestión de recibos de pago.</CardDescription>
                </div>
                <Button asChild>
                    <Link href="/dashboard/receipts/new">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Recibo
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Número</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {receipts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hay recibos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            receipts.map((receipt) => (
                                <TableRow key={receipt.id}>
                                    <TableCell>
                                        {format(new Date(receipt.date), 'dd/MM/yyyy', { locale: es })}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        #{receipt.number.toString().padStart(6, '0')}
                                    </TableCell>
                                    <TableCell>{receipt.client.name}</TableCell>
                                    <TableCell>{receipt.description || '-'}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(receipt.totalAmount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                                title="Imprimir"
                                            >
                                                <a href={`/api/receipts/${receipt.id}/pdf/download`} download>
                                                    <FileText className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(receipt.id)}
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
