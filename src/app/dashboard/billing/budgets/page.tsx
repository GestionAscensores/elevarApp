import { getInvoices } from '@/actions/billing'
import { InvoiceDownloadButton } from '@/components/billing/invoice-download'
import { EmailButton } from '@/components/billing/email-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil } from 'lucide-react'
import Link from 'next/link'
import { EmitInvoiceButton } from '@/components/billing/emit-button'
import { DeleteInvoiceButton } from '@/components/billing/delete-button'

export default async function BudgetsPage() {
    const rawQuotes = await getInvoices({ isBudget: true })

    // Helper to serialize decimals
    const serializeInvoice = (inv: any) => ({
        ...inv,
        netAmount: inv.netAmount ? Number(inv.netAmount) : 0,
        ivaAmount: inv.ivaAmount ? Number(inv.ivaAmount) : 0,
        totalAmount: inv.totalAmount ? Number(inv.totalAmount) : 0,
        exchangeRate: inv.exchangeRate ? Number(inv.exchangeRate) : 0,
        items: inv.items?.map((item: any) => ({
            ...item,
            quantity: item.quantity ? Number(item.quantity) : 0,
            price: item.price ? Number(item.price) : 0,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
            subtotal: item.subtotal ? Number(item.subtotal) : 0,
            ivaRate: item.ivaRate ? Number(item.ivaRate) : 0,
        }))
    })

    const quotes = rawQuotes.map(serializeInvoice)

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
                        <p className="text-muted-foreground">Gestione los presupuestos y cotizaciones.</p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/billing/new?type=quote">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Presupuesto
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Presupuestos</CardTitle>
                    <CardDescription>Presupuestos generados. Puede emitirlos para convertirlos en facturas fiscales.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha Creación</TableHead>
                                <TableHead>N°</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Concepto</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No hay presupuestos registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                quotes.map((inv: any) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>{new Date(inv.createdAt).toLocaleDateString('es-AR')}</TableCell>
                                        <TableCell className="font-mono">
                                            {inv.quoteNumber ? `N° ${String(inv.quoteNumber).padStart(3, '0')}` : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">{inv.client?.name}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {inv.items?.[0]?.description || 'Vario'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">${Number(inv.totalAmount).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                                <Link href={`/dashboard/billing/${inv.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <InvoiceDownloadButton
                                                invoice={inv}
                                            />
                                            <EmailButton invoiceId={inv.id} hasEmail={!!inv.client?.email} />
                                            <EmitInvoiceButton id={inv.id} />
                                            <DeleteInvoiceButton id={inv.id} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div >
    )
}
