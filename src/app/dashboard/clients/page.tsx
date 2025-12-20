import { getClients } from '@/actions/clients'
import { ClientDataActions } from '@/components/clients/client-data-actions'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ClientList } from '@/components/clients/client-list'

export default async function ClientsPage({
    searchParams,
}: {
    searchParams?: Promise<{ query?: string }>
}) {
    const params = await searchParams;
    const query = params?.query || '';
    const clients = await getClients(query)

    // Normalize data to avoid passing Decimal objects to Client Component
    const normalizedClients = clients.map((client: any) => ({
        ...client,
        items: client.items.map((item: any) => ({
            ...item,
            price: Number(item.price), // Convert Decimal to Number
            quantity: Number(item.quantity)
        }))
    }))

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Gestión de Clientes</h1>
                <Button asChild>
                    <Link href="/dashboard/clients/new">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                    </Link>
                </Button>
            </div>

            <ClientDataActions />

            <ClientList initialClients={normalizedClients} />
        </div>
    )
}
