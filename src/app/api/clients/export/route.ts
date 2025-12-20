
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await verifySession()
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const clients = await db.client.findMany({
        where: { userId: session.userId },
        include: { items: true },
        orderBy: { name: 'asc' }
    })

    const csvRows = [
        ['Nombre', 'Tipo Doc', 'Documento', 'Direccion', 'Email', 'Telefono', 'Condicion IVA', 'Equipos'].join(',')
    ]

    for (const client of clients) {
        // Serialize items to JSON, escaping quotes for CSV
        const itemsJson = JSON.stringify(client.items || []).replace(/"/g, '""')

        csvRows.push([
            `"${client.name}"`,
            `"${client.docType}"`,
            `"${client.cuit}"`,
            `"${client.address || ''}"`,
            `"${client.email || ''}"`,
            `"${client.phone || ''}"`,
            `"${client.ivaCondition || 'Consumidor Final'}"`,
            `"${itemsJson}"`
        ].join(','))
    }

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="clientes-${new Date().toISOString().split('T')[0]}.csv"`
        }
    })
}
