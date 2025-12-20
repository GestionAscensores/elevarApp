import { getInvoices } from '@/actions/billing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
// import { Download, Printer } from 'lucide-react' // Unused here now
import { ArchivedActions } from '@/components/billing/archived-actions'

export default async function ArchivedInvoicesPage() {
    // Get PROVISIONAL invoices
    const allInvoices = await getInvoices({ isCreditNote: false })
    const drafts = allInvoices.filter((i: any) => i.status === 'PROVISIONAL')

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Archivadas sin emitir</h1>
                        <p className="text-muted-foreground">Facturas impresas provisionalmente, pendientes de emisión fiscal.</p>
                    </div>
                </div>
            </div>

            <Card className="border-blue-200 bg-blue-50/10">
                <CardHeader>
                    <CardTitle className="text-blue-700">Comprobantes Provisionales</CardTitle>
                    <CardDescription>Estos documentos ya tienen numeración interna pero no son fiscales.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Provisional N°</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Concepto</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {drafts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No hay facturas archivadas.
                                    </TableCell>
                                </TableRow>
                            )}
                            {drafts.map((inv: any) => (
                                <TableRow key={inv.id}>
                                    <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-mono font-bold">#{inv.draftNumber}</TableCell>
                                    <TableCell className="font-medium">{inv.client?.name}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {inv.items?.[0]?.description || 'Vario'}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">${Number(inv.totalAmount).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <ArchivedActions invoice={inv} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
