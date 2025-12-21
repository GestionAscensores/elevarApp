'use client'

import Link from 'next/link'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { InvoiceDownloadButton } from '@/components/billing/invoice-download'
import { EmailButton } from '@/components/billing/email-button'
import { CreateCreditNoteButton } from '@/components/billing/nc-button'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Printer, Loader2, Copy, CheckCircle, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { togglePaymentStatus, markMultipleAsPaid } from '@/actions/payments'

export function InvoiceHistoryTable({ invoices }: { invoices: any[] }) {
    const [selected, setSelected] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    // Toggle All
    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelected(invoices.map(i => i.id))
        } else {
            setSelected([])
        }
    }

    // Toggle One
    const toggleOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelected(prev => [...prev, id])
        } else {
            setSelected(prev => prev.filter(x => x !== id))
        }
    }

    // Bulk Print Action
    const handleBulkPrint = async () => {
        if (selected.length === 0) return
        setLoading(true)

        try {
            const response = await fetch('/api/invoices/bulk-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceIds: selected })
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.message || 'Error al generar PDF')
            }

            // Download Blob
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `facturas-seleccionadas.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('PDF Generado correctamente')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }

    }

    // Bulk Pay Action
    const handleBulkPay = async () => {
        if (selected.length === 0) return
        setLoading(true)
        try {
            const res = await markMultipleAsPaid(selected)
            if (res.success) {
                toast.success('Facturas marcadas como Pagadas')
                setSelected([])
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error('Error al actualizar')
        } finally {
            setLoading(false)
        }
    }

    const handleTogglePayment = async (e: React.MouseEvent, id: string, currentStatus: string) => {
        e.stopPropagation() // Prevent row click
        // Optimistic update could go here but let's rely on server for now
        const res = await togglePaymentStatus(id, currentStatus)
        if (res.success) {
            toast.success(res.newStatus === 'PAID' ? 'Marcada como Pagada' : 'Marcada como Impaga')
        } else {
            toast.error(res.message)
        }
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            {selected.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">{selected.length} seleccionadas</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={handleBulkPay} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                            Marcar Pagadas
                        </Button>
                        <Button size="sm" onClick={handleBulkPrint} disabled={loading} variant="outline">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            Imprimir
                        </Button>
                    </div>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                            <Checkbox
                                checked={selected.length === invoices.length && invoices.length > 0}
                                onCheckedChange={toggleAll}
                            />
                        </TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nro</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>CAE</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                No se encontraron facturas emitidas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((inv: any) => (
                            <TableRow key={inv.id} data-state={selected.includes(inv.id) && "selected"}>
                                <TableCell>
                                    <Checkbox
                                        checked={selected.includes(inv.id)}
                                        onCheckedChange={(checked) => toggleOne(inv.id, !!checked)}
                                    />
                                </TableCell>
                                <TableCell>{inv.date ? new Date(inv.date).toLocaleDateString('es-AR') : '-'}</TableCell>
                                <TableCell>Factura {inv.type}</TableCell>
                                <TableCell className="font-mono">
                                    <Link href={`/dashboard/billing/${inv.id}`} className="hover:underline text-blue-600">
                                        {String(inv.number).padStart(8, '0')}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {inv.client ? (
                                        <Link href={`/dashboard/clients/${inv.client.id}`} className="hover:underline text-primary">
                                            {inv.client.name}
                                        </Link>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{inv.cae}</TableCell>
                                <TableCell className="text-right font-bold">${Number(inv.totalAmount).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <div
                                        className="inline-flex cursor-pointer"
                                        onClick={(e) => handleTogglePayment(e, inv.id, inv.paymentStatus || 'PENDING')}
                                    >
                                        {inv.paymentStatus === 'PAID' ? (
                                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                                Pagada
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100">
                                                Impaga
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild title="Clonar Factura">
                                            <Link href={`/dashboard/billing/new?cloneId=${inv.id}`}>
                                                <Copy className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <InvoiceDownloadButton invoice={inv} />
                                        <EmailButton invoiceId={inv.id} hasEmail={!!inv.client?.email} sentCount={inv.sentCount} />
                                        <CreateCreditNoteButton invoiceId={inv.id} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
