import { getInvoices } from '@/actions/billing'
import { InvoiceDownloadButton } from '@/components/billing/invoice-download'
import { EmailButton } from '@/components/billing/email-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, ArrowUpRight, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { EmitInvoiceButton } from '@/components/billing/emit-button'
import { DeleteInvoiceButton } from '@/components/billing/delete-button'

export default async function CreditNotesPage() {
    const rawNCs = await getInvoices({ isCreditNote: true })

    const serializeInvoice = (inv: any) => ({
        ...inv,
        netAmount: Number(inv.netAmount || 0),
        ivaAmount: Number(inv.ivaAmount || 0),
        totalAmount: Number(inv.totalAmount || 0),
        exchangeRate: Number(inv.exchangeRate || 1),
        relatedInvoice: inv.relatedInvoice ? {
            ...inv.relatedInvoice,
            netAmount: Number(inv.relatedInvoice.netAmount || 0),
            ivaAmount: Number(inv.relatedInvoice.ivaAmount || 0),
            totalAmount: Number(inv.relatedInvoice.totalAmount || 0),
            exchangeRate: Number(inv.relatedInvoice.exchangeRate || 1),
        } : null,
        items: inv.items?.map((item: any) => ({
            ...item,
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            subtotal: Number(item.subtotal || 0),
            ivaRate: String(item.ivaRate || '0')
        }))
    })

    const allNCs = rawNCs.map(serializeInvoice)

    const drafts = allNCs.filter((i: any) => i.status === 'DRAFT')
    const issued = allNCs.filter((i: any) => i.status !== 'DRAFT')

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Notas de Crédito</h1>
                        <p className="text-muted-foreground">Gestione anulaciones y correcciones de facturas.</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/billing/invoices">
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Ir a Facturas para Emitir NC
                        </Link>
                    </Button>
                </div>
            </div>

            {/* DRAFTS SECTION */}
            {drafts.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/10">
                    <CardHeader>
                        <CardTitle className="text-yellow-700">Borradores de NC</CardTitle>
                        <CardDescription>Notas de crédito pendientes de emisión.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha Gen.</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Factura a Anular</TableHead>
                                    <TableHead className="text-right">Total Estimado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drafts.map((inv: any) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>{new Date(inv.createdAt).toLocaleDateString('es-AR')}</TableCell>
                                        <TableCell className="font-medium">{inv.client?.name}</TableCell>
                                        <TableCell>
                                            {inv.relatedInvoice ?
                                                `Factura ${inv.relatedInvoice.type} ${String(inv.relatedInvoice.number).padStart(8, '0')}` :
                                                'Sin Referencia'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">${Number(inv.totalAmount).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Edit might be complex for NC if tied to invoice items, but standard edit works if logic supports it */}
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" asChild>
                                                    <Link href={`/dashboard/billing/${inv.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <EmitInvoiceButton id={inv.id} />
                                                <DeleteInvoiceButton id={inv.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Notas de Crédito</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-8" placeholder="Buscar..." />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Nro</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Ref. Factura</TableHead>
                                <TableHead>CAE</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {issued.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                        No se encontraron notas de crédito emitidas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                issued.map((inv: any) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell>{inv.type}</TableCell>
                                        <TableCell className="font-mono">{String(inv.number).padStart(8, '0')}</TableCell>
                                        <TableCell>{inv.client?.name}</TableCell>
                                        <TableCell>
                                            {inv.relatedInvoice ?
                                                `${inv.relatedInvoice.type} ${String(inv.relatedInvoice.number).padStart(8, '0')}` :
                                                '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{inv.cae}</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">-${Number(inv.totalAmount).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprobada</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <InvoiceDownloadButton invoice={inv} />
                                                <EmailButton invoiceId={inv.id} hasEmail={!!inv.client?.email} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
