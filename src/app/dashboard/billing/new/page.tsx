import { InvoiceForm } from '@/components/billing/invoice-form'
import { getClients } from '@/actions/clients'
import { getProducts } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const rawClients = await getClients()
    const clients = rawClients.map(c => ({
        ...c,
        items: c.items.map(i => ({
            ...i,
            quantity: Number(i.quantity),
            price: Number(i.price)
        }))
    }))
    const rawProducts = await getProducts()
    // Serialize products for Client Component
    const products = rawProducts.map(p => ({
        ...p,
        price: Number(p.price),
        ivaRate: String(p.ivaRate)
    }))
    const session = await verifySession()

    const sp = await searchParams
    const isQuote = sp.type === 'quote'
    const cloneId = typeof sp.cloneId === 'string' ? sp.cloneId : undefined
    const title = isQuote ? 'Nuevo Presupuesto' : 'Nueva Factura'

    let initialData = undefined

    if (cloneId && session) {
        const sourceInvoice = await db.invoice.findUnique({
            where: { id: cloneId, userId: session.userId },
            include: { items: true }
        })
        if (sourceInvoice) {
            initialData = {
                clientId: sourceInvoice.clientId,
                type: sourceInvoice.type,
                paymentCondition: sourceInvoice.paymentCondition,
                paymentDue: sourceInvoice.paymentDue,
                items: sourceInvoice.items.map(i => ({
                    productId: i.productId || '',
                    description: i.description,
                    quantity: Number(i.quantity), // Serialize Decimal
                    price: Number(i.unitPrice),   // Serialize Decimal
                    ivaRate: String(i.ivaRate)
                }))
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={isQuote ? "/dashboard/billing/budgets" : "/dashboard/billing"}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            </div>
            <InvoiceForm clients={clients} products={products} isQuote={isQuote} initialData={initialData ? { ...initialData, paymentCondition: initialData.paymentCondition || "" } : undefined} />
        </div>
    )
}
