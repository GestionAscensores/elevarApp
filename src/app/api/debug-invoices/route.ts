import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const invoices = await db.invoice.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true, quoteNumber: true, type: true, number: true, createdAt: true }
        })
        return NextResponse.json(invoices)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
