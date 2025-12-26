
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await verifySession()
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const products = await db.product.findMany({
        where: { userId: session.userId },
        orderBy: { name: 'asc' }
    })

    const csvRows = [
        ['Codigo', 'Nombre', 'Descripcion', 'Precio', 'Stock', 'Codigo Barras', 'Imagen URL', 'Tasa IVA'].join(',')
    ]

    for (const product of products) {
        csvRows.push([
            `"${product.code || ''}"`,
            `"${product.name.replace(/"/g, '""')}"`,
            `"${(product.description || '').replace(/"/g, '""')}"`,
            `"${product.price}"`,
            `"${product.stock}"`,
            `"${product.barcode || ''}"`,
            `"${product.imageUrl || ''}"`, // Export the image URL
            `"${product.ivaRate || '21'}"`
        ].join(','))
    }

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="repuestos-${new Date().toISOString().split('T')[0]}.csv"`
        }
    })
}
