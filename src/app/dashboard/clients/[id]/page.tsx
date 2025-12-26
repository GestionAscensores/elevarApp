import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { EditClientForm } from '@/components/clients/edit-client-form'
import { ClientInvoiceList } from '@/components/clients/client-invoice-list'
import { EquipmentList } from '@/components/maintenance/equipment-list'
import { notFound, redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { QRButton } from '@/components/maintenance/qr-button'

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

    // Fetch Equipment
    const equipment = await db.equipment.findMany({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Ficha del Cliente</h1>
                <QRButton clientId={id} />
            </div>

            <Tabs defaultValue="history" className="w-full space-y-4">
                <TabsList>
                    <TabsTrigger value="data">Datos</TabsTrigger>
                    <TabsTrigger value="history">Historial de Facturas</TabsTrigger>
                    <TabsTrigger value="equipment">Equipos (Bitácora)</TabsTrigger>
                </TabsList>
                <TabsContent value="data" className="space-y-4">
                    <EditClientForm client={serializedClient} />
                </TabsContent>
                <TabsContent value="history">
                    <ClientInvoiceList invoices={serializedClient.invoices} />
                </TabsContent>
                <TabsContent value="equipment">
                    <EquipmentList clientId={id} equipment={equipment} clientName={client.name} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
