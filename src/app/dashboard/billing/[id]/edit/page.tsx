import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { EditInvoiceForm } from '@/components/billing/edit-invoice-form'
import { notFound, redirect } from 'next/navigation'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession()
    if (!session) redirect('/login')

    const { id } = await params
    const invoice = await db.invoice.findUnique({
        where: { id, userId: session.userId },
        include: { items: true, client: true, relatedInvoice: true }
    })

    if (!invoice) notFound()
    if (invoice.status !== 'DRAFT' && invoice.status !== 'QUOTE') return <div>Solo se pueden editar borradores o presupuestos.</div>

    const products = await db.product.findMany({
        where: { userId: session.userId }
    })

    // Determinar título según tipo de documento
    const getTitle = () => {
        if (invoice.status === 'QUOTE') return 'Editar Presupuesto'
        if (invoice.type?.includes('NC') || invoice.type?.includes('CREDIT')) return 'Editar Nota de Crédito'
        return 'Editar Factura'
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">{getTitle()}</h1>
            <EditInvoiceForm invoice={invoice} products={products} />
        </div>
    )
}
