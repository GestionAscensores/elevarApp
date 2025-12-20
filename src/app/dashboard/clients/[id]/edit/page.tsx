import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { EditClientForm } from '@/components/clients/edit-client-form'
import { notFound, redirect } from 'next/navigation'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession()
    if (!session) redirect('/login')

    const { id } = await params
    const client = await db.client.findUnique({
        where: { id, userId: session.userId },
        include: { items: true }
    })

    if (!client) notFound()

    // Serialize Decimals for Client Component
    const serializedClient = {
        ...client,
        items: client.items.map(item => ({
            ...item,
            price: Number(item.price)
        }))
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Editar Cliente</h1>
            <EditClientForm client={serializedClient} />
        </div>
    )
}
