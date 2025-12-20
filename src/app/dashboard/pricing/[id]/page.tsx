
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { EditProductForm } from '@/components/products/edit-product-form'
import { notFound } from 'next/navigation'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession()
    if (!session) return notFound()

    const productId = (await params).id

    const product = await db.product.findUnique({
        where: { id: productId, userId: session.userId }
    })

    if (!product) return notFound()

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Editar Producto</h1>
            <EditProductForm product={product} />
        </div>
    )
}
