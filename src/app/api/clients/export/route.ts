
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
        include: {
            items: true,
            equipment: {
                include: { visits: true }
            },
            invoices: {
                orderBy: { date: 'desc' },
                take: 100 // Limit to last 100 invoices per client to avoid CSV explosion
            },
            priceHistory: {
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { name: 'asc' }
    })

    const csvRows = [
        ['Nombre', 'Tipo Doc', 'Documento', 'Direccion', 'Email', 'Telefono', 'Condicion IVA', 'Equipos (Billing)', 'Bitacora (JSON)', 'Facturas (JSON)', 'Historial Precios (JSON)'].join(',')
    ]

    for (const client of clients) {
        // Serialize items to JSON, escaping quotes for CSV
        const itemsJson = JSON.stringify(client.items || []).replace(/"/g, '""')
        const equipmentJson = JSON.stringify(client.equipment || []).replace(/"/g, '""')
        const invoicesJson = JSON.stringify(client.invoices || []).replace(/"/g, '""')
        const pricesJson = JSON.stringify(client.priceHistory || []).replace(/"/g, '""')

        csvRows.push([
            `"${client.name}"`,
            `"${client.docType}"`,
            `"${client.cuit}"`,
            `"${client.address || ''}"`,
            `"${client.email || ''}"`,
            `"${client.phone || ''}"`,
            `"${client.ivaCondition || 'Consumidor Final'}"`,
            `"${itemsJson}"`,
            `"${equipmentJson}"`,
            `"${invoicesJson}"`,
            `"${pricesJson}"`
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
