import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { CreateReceiptForm } from '@/components/receipts/create-receipt-form'
import { redirect } from 'next/navigation'

export default async function NewReceiptPage() {
    const session = await verifySession()
    if (!session) redirect('/login')

    const clients = await db.client.findMany({
        where: { userId: session.userId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Generar Recibo</h1>
            <CreateReceiptForm clients={clients} />
        </div>
    )
}
