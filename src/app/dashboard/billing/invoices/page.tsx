import { getInvoices } from '@/actions/billing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Plus, Files } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { InvoiceHistoryTable } from '@/components/billing/invoice-history-table'
import { DraftsTable } from '@/components/billing/drafts-table'

export default async function InvoicesPage() {
    // Get all invoices that are NOT Credit Notes
    const rawInvoices = await getInvoices({ isCreditNote: false })

    // Helper to serialize decimals
    const serializeInvoice = (inv: any) => ({
        ...inv,
        netAmount: inv.netAmount ? Number(inv.netAmount) : 0,
        ivaAmount: inv.ivaAmount ? Number(inv.ivaAmount) : 0,
        totalAmount: inv.totalAmount ? Number(inv.totalAmount) : 0,
        exchangeRate: inv.exchangeRate ? Number(inv.exchangeRate) : 0,
        relatedInvoice: inv.relatedInvoice ? {
            ...inv.relatedInvoice,
            netAmount: Number(inv.relatedInvoice.netAmount || 0),
            ivaAmount: Number(inv.relatedInvoice.ivaAmount || 0),
            totalAmount: Number(inv.relatedInvoice.totalAmount || 0),
            exchangeRate: Number(inv.relatedInvoice.exchangeRate || 1),
        } : null,
        items: inv.items?.map((item: any) => ({
            ...item,
            quantity: item.quantity ? Number(item.quantity) : 0,
            price: item.price ? Number(item.price) : (item.unitPrice ? Number(item.unitPrice) : 0),
            unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
            subtotal: item.subtotal ? Number(item.subtotal) : 0,
            ivaRate: item.ivaRate ? Number(item.ivaRate) : 0,
        }))
    })

    const allInvoices = rawInvoices.map(serializeInvoice)

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
            <DraftsTable drafts={drafts} />

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
