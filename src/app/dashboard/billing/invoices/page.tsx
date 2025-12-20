import { getInvoices } from '@/actions/billing'
import { InvoiceDownloadButton } from '@/components/billing/invoice-download'
import { EmailButton } from '@/components/billing/email-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Pencil, Files } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { EmitInvoiceButton } from '@/components/billing/emit-button'
import { DeleteInvoiceButton } from '@/components/billing/delete-button'
import { CreateCreditNoteButton } from '@/components/billing/nc-button'
import { InvoiceHistoryTable } from '@/components/billing/invoice-history-table'

import { PrintDraftButton } from '@/components/billing/print-draft-button'

export default async function InvoicesPage() {
    // Get all invoices that are NOT Credit Notes
    const allInvoices = await getInvoices({ isCreditNote: false })

    // Filter locally
    const drafts = allInvoices.filter((i: any) => i.status === 'DRAFT')
    // Exclude quotes from this view (they are in Presupuestos)
    const issued = allInvoices.filter((i: any) => i.status !== 'DRAFT' && i.status !== 'PROVISIONAL' && i.status !== 'QUOTE')

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
                        <p className="text-muted-foreground">Administre sus facturas emitidas y borradores.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/billing/mass">
                                <Files className="mr-2 h-4 w-4" />
                                Facturación Masiva
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/billing/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Factura
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* DRAFTS SECTION */}
            {drafts.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/10">
                    <CardHeader>
                        <CardTitle className="text-yellow-700">Borradores</CardTitle>
                        <CardDescription>Borradores pendientes de impresión o emisión.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha Gen.</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead className="text-right">Total Estimado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drafts.map((inv: any) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{inv.client?.name}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {inv.items?.[0]?.description || 'Vario'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">${Number(inv.totalAmount).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <PrintDraftButton invoice={inv} />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" asChild title="Editar">
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
                    <CardTitle>Historial de Facturas Emitidas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-8" placeholder="Buscar por cliente o número..." />
                        </div>
                    </div>

                    <InvoiceHistoryTable invoices={issued} />
                </CardContent>
            </Card>
        </div>
    )
}
