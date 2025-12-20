import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { InvoiceDetailsActions } from '@/components/billing/invoice-details-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { notFound, redirect } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function InvoiceDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const session = await verifySession()
    if (!session) redirect('/login')

    const { id } = await params
    const sp = await searchParams
    const isReadOnly = sp.readonly === 'true'

    const rawInvoice = await db.invoice.findUnique({
        where: { id, userId: session.userId },
        include: { items: true, client: true }
    })

    if (!rawInvoice) notFound()

    // Serialize Decimals for Client Component
    const invoice = {
        ...rawInvoice,
        netAmount: Number(rawInvoice.netAmount),
        ivaAmount: Number(rawInvoice.ivaAmount),
        totalAmount: Number(rawInvoice.totalAmount),
        exchangeRate: Number(rawInvoice.exchangeRate),
        items: rawInvoice.items.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            ivaRate: String(item.ivaRate)
        }))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {invoice.type.startsWith('NC') ? 'Nota de Crédito' : 'Factura'} {invoice.type}
                    </h1>
                    <div className="flex items-center mt-2 gap-2">
                        <Badge variant="outline">
                            {invoice.status === 'APPROVED' ?
                                `${String(invoice.pointOfSale).padStart(4, '0')}-${String(invoice.number).padStart(8, '0')}` :
                                invoice.status === 'PROVISIONAL' ? `Borrador #${invoice.draftNumber}` :
                                    'Borrador'}
                        </Badge>
                        <Badge className={
                            invoice.status === 'APPROVED' ? 'bg-green-500' :
                                invoice.status === 'PROVISIONAL' ? 'bg-orange-500' : 'bg-gray-500'
                        }>
                            {invoice.status === 'APPROVED' ? 'Emitida' :
                                invoice.status === 'PROVISIONAL' ? 'Provisional' : 'Borrador'}
                        </Badge>
                    </div>
                </div>
                <InvoiceDetailsActions invoice={invoice} isReadOnly={isReadOnly} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-semibold">Nombre:</span>
                            <span>{invoice.client.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">CUIT:</span>
                            <span>{invoice.client.cuit}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Condición IVA:</span>
                            <span>{invoice.client.ivaCondition}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Dirección:</span>
                            <span>{invoice.client.address || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detalles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-semibold">Fecha:</span>
                            <span>{format(new Date(invoice.date), 'dd/MM/yyyy', { locale: es })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Condición Venta:</span>
                            <span>{invoice.paymentCondition}</span>
                        </div>
                        {invoice.cae && (
                            <div className="flex justify-between">
                                <span className="font-semibold">CAE:</span>
                                <span>{invoice.cae}</span>
                            </div>
                        )}
                        {invoice.totalAmount && (
                            <div className="flex justify-between pt-4 border-t">
                                <span className="font-bold text-lg">Total:</span>
                                <span className="font-bold text-lg">
                                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(invoice.totalAmount))}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-center">Cant.</TableHead>
                                <TableHead className="text-right">Precio Unit.</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell className="text-center">{Number(item.quantity)}</TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(item.unitPrice))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(item.subtotal))}
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
