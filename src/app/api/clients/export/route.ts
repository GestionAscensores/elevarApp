
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
        ['Nro Cliente', 'Nombre', 'Tipo Doc', 'Documento', 'Direccion', 'Email', 'Telefono', 'Condicion IVA', 'Equipos (Billing)', 'Bitacora (JSON)', 'Facturas (JSON)', 'Historial Precios (JSON)'].join(',')
    ]

    // Helper to escape CSV fields compliant with RFC 4180
    const toCsvField = (value: any) => {
        if (value === null || value === undefined) return '""'
        const stringValue = String(value)
        // Check if value needs escaping (contains ", \n, or ,)
        if (stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes(',')) {
            return `"${stringValue.replace(/"/g, '""')}"`
        }
        return `"${stringValue}"` // Always quote for consistency, though optional if no special chars
    }

    for (const client of clients) {
        const itemsJson = JSON.stringify(client.items || [])
        const equipmentJson = JSON.stringify(client.equipment || [])
        const invoicesJson = JSON.stringify(client.invoices || [])
        const pricesJson = JSON.stringify(client.priceHistory || [])

        csvRows.push([
            toCsvField(client.clientNumber || ''),
            toCsvField(client.name),
            toCsvField(client.docType),
            toCsvField(client.cuit),
            toCsvField(client.address || ''),
            toCsvField(client.email || ''),
            toCsvField(client.phone || ''),
            toCsvField(client.ivaCondition || 'Consumidor Final'),
            toCsvField(itemsJson),
            toCsvField(equipmentJson),
            toCsvField(invoicesJson),
            toCsvField(pricesJson)
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
