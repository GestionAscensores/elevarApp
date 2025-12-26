
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const session = await verifySession()
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return new NextResponse('No file provided', { status: 400 })
        }

        const text = await file.text()
        const lines = text.split(/\r?\n/)

        let successCount = 0
        let errorCount = 0

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // Regex for CSV split handling quotes
            const row = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)?.map(val => {
                return val.replace(/^,/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()
            })

            if (!row || row.length < 2) {
                errorCount++
                continue
            }

            const [code, name, description, price, stock, barcode, imageUrl, ivaRate] = row

            if (!name) {
                errorCount++
                continue
            }

            // Identify product to update
            // Strategy: 
            // 1. Try Barcode (if provided)
            // 2. Try Code (if provided)
            // 3. Try Name (exact match)

            let existing = null

            if (barcode) {
                existing = await db.product.findFirst({
                    where: { userId: session.userId, barcode: barcode }
                })
            }

            if (!existing && code) {
                existing = await db.product.findFirst({
                    where: { userId: session.userId, code: code }
                })
            }

            if (!existing) {
                existing = await db.product.findFirst({
                    where: { userId: session.userId, name: name }
                })
            }

            const productData = {
                code: code || null,
                name: name,
                description: description || '',
                price: Number(price) || 0,
                stock: Number(stock) || 0,
                barcode: barcode || null,
                imageUrl: imageUrl || null,
                ivaRate: ivaRate || '21',
                userId: session.userId
            }

            if (existing) {
                // Update
                await db.product.update({
                    where: { id: existing.id },
                    data: productData
                })
            } else {
                // Create
                await db.product.create({
                    data: productData
                })
            }
            successCount++
        }

        return NextResponse.json({ success: true, count: successCount, errors: errorCount })
    } catch (e) {
        console.error(e)
        return new NextResponse('Error processing file', { status: 500 })
    }
}
