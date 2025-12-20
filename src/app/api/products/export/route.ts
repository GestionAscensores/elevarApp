
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
        ['Codigo', 'Nombre', 'Descripcion', 'Precio'].join(',')
    ]

    for (const prod of products) {
        csvRows.push([
            `"${prod.code || ''}"`,
            `"${prod.name}"`,
            `"${prod.description || ''}"`,
            `"${prod.price}"`
        ].join(','))
    }

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="productos-${new Date().toISOString().split('T')[0]}.csv"`
        }
    })
}
