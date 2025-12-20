
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { NextResponse } from 'next/server'

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

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const row = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)?.map(val => {
                return val.replace(/^,/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()
            })

            if (!row || row.length < 4) continue // Need Code, Name, Description, Price

            const [code, name, description, priceStr, ivaRate] = row

            if (!name || !priceStr) continue

            const price = parseFloat(priceStr)
            if (isNaN(price)) continue

            // Create only (no easy unique key for upsert besides ID which we don't have, or Code)
            // Assuming Code is unique per user if provided

            if (code) {
                const existing = await db.product.findFirst({
                    where: { userId: session.userId, code }
                })

                if (existing) {
                    await db.product.update({
                        where: { id: existing.id },
                        data: {
                            name,
                            description: description || '',
                            price,
                            ivaRate: ivaRate || '21'
                        }
                    })
                } else {
                    await db.product.create({
                        data: {
                            userId: session.userId,
                            code,
                            name,
                            description: description || '',
                            price,
                            ivaRate: ivaRate || '21'
                        }
                    })
                }
            } else {
                await db.product.create({
                    data: {
                        userId: session.userId,
                        code: `P${Date.now()}${i}`, // Temp code if missing
                        name,
                        description: description || '',
                        price,
                        ivaRate: ivaRate || '21'
                    }
                })
            }
            successCount++
        }

        return NextResponse.json({ success: true, count: successCount })
    } catch (e) {
        console.error(e)
        return new NextResponse('Error processing file', { status: 500 })
    }
}
