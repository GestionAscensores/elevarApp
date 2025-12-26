'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { InvoiceDownloadButton } from '@/components/billing/invoice-download'
import { EmailButton } from '@/components/billing/email-button'
import { CreateCreditNoteButton } from '@/components/billing/nc-button'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Printer, Loader2, Copy, CheckCircle, DollarSign, Send } from 'lucide-react'
import { toast } from 'sonner'
import { togglePaymentStatus, markMultipleAsPaid } from '@/actions/payments'
import { sendMassEmails } from '@/actions/email'

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

    // Bulk Email Action
    const handleBulkEmail = async () => {
        if (selected.length === 0) return
        if (!confirm(`¿Desea enviar por correo ${selected.length} facturas? Esto tomará unos segundos para evitar saturación.`)) return

        setLoading(true)
        try {
            const res = await sendMassEmails(selected)
            if (res.success) {
                toast.success(res.message)
                setSelected([]) // Clear selection on success
            } else {
                toast.warning(res.message) // Warning if some failed
            }
        } catch (error) {
            toast.error('Error al enviar correos')
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
                        <Button size="sm" onClick={handleBulkEmail} disabled={loading} variant="secondary">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar x Mail
                        </Button>
                    </div>
                </div>
            )}

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {invoices.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/20">
                        No se encontraron facturas emitidas.
                    </div>
                ) : (
                    invoices.map((inv: any) => (
                        <Card key={inv.id} className={`overflow-hidden transition-all ${selected.includes(inv.id) ? 'ring-2 ring-primary border-primary' : ''}`}>
                            <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={selected.includes(inv.id)}
                                        onCheckedChange={(checked) => toggleOne(inv.id, !!checked)}
                                    />
                                    <div>
                                        <Link href={`/dashboard/billing/${inv.id}`} className="font-bold text-blue-600 hover:underline">
                                            #{String(inv.number).padStart(8, '0')}
                                        </Link>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {inv.date ? new Date(inv.date).toLocaleDateString('es-AR', {
                                                day: 'numeric', month: 'short'
                                            }) : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className="cursor-pointer"
                                    onClick={(e) => handleTogglePayment(e, inv.id, inv.paymentStatus || 'PENDING')}
                                >
                                    {inv.paymentStatus === 'PAID' ? (
                                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-[10px] px-1.5 h-5">
                                            Pagada
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-[10px] px-1.5 h-5">
                                            Impaga
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex-1 mr-2">
                                        <p className="text-sm font-medium truncate">
                                            {inv.client ? (
                                                <Link href={`/dashboard/clients/${inv.client.id}`} className="hover:underline">
                                                    {inv.client.name}
                                                </Link>
                                            ) : '-'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Factura {inv.type}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold">
                                            ${Number(inv.totalAmount).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="bg-muted/30 p-2 flex justify-end gap-2 border-t">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild title="Clonar Factura">
                                    <Link href={`/dashboard/billing/new?cloneId=${inv.id}`}>
                                        <Copy className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <InvoiceDownloadButton invoice={inv} />
                                <EmailButton invoiceId={inv.id} hasEmail={!!inv.client?.email} sentCount={inv.sentCount} />
                                <CreateCreditNoteButton invoiceId={inv.id} />
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block rounded-md border">
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
        </div>
    )
}
