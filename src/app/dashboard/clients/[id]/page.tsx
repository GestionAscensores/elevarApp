import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { EditClientForm } from '@/components/clients/edit-client-form'
import { ClientInvoiceList } from '@/components/clients/client-invoice-list'
import { notFound, redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ClientValidPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession()
    if (!session) redirect('/login')

    const { id } = await params
    const client = await db.client.findUnique({
        where: { id, userId: session.userId },
        include: {
            items: true,
            invoices: {
                orderBy: { date: 'desc' },
                take: 50 // Last 50 invoices
            }
        }
    })

    if (!client) notFound()

    // Serialize for Client Components
    const serializedClient = {
        ...client,
        items: client.items.map(item => ({
            ...item,
            price: Number(item.price)
        })),
        invoices: client.invoices.map(inv => ({
            ...inv,
            netAmount: Number(inv.netAmount),
            ivaAmount: Number(inv.ivaAmount),
            totalAmount: Number(inv.totalAmount),
            exchangeRate: Number(inv.exchangeRate)
        }))
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Ficha del Cliente</h1>

            <Tabs defaultValue="history" className="w-full space-y-4">
                <TabsList>
                    <TabsTrigger value="data">Datos</TabsTrigger>
                    <TabsTrigger value="history">Historial de Facturas</TabsTrigger>
                    {/* Future: <TabsTrigger value="receipts">Recibos</TabsTrigger> */}
                </TabsList>
                <TabsContent value="data" className="space-y-4">
                    <EditClientForm client={serializedClient} />
                </TabsContent>
                <TabsContent value="history">
                    <ClientInvoiceList invoices={serializedClient.invoices} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
