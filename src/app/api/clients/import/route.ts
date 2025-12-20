
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
        let errorCount = 0

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // Simple CSV parser: handles quoted fields
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
            // Fallback for simple split if regex fails or complicates
            // Actually, let's use a simpler split if quotes aren't heavy, but regex is safer for "Name, Corp"

            // Simplified split (assuming no commas in values for MVP or quoted values)
            // Better regex for CSV:
            const row = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)?.map(val => {
                return val.replace(/^,/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()
            })

            if (!row || row.length < 2) continue

            const [name, docType, cuit, address, email, phone, ivaCondition, itemsJson] = row

            if (!name || !cuit) {
                errorCount++
                continue
            }

            let equipments = []
            try {
                if (itemsJson) {
                    equipments = JSON.parse(itemsJson)
                }
            } catch (e) {
                console.error("Error parsing items JSON", e)
            }

            // Create or Update
            // Fix: unique constraint is now [userId, cuit, address]
            // We must include address in the 'where' clause of upsert, 
            // BUT Prisma upsert requires a unique compound index.
            // The index is @@unique([userId, cuit, address])
            // So we need to provide `userId_cuit_address`.

            // Transactional update/create to handle relations
            await db.$transaction(async (tx) => {
                const uniqueInput = {
                    userId: session.userId,
                    cuit: cuit.replace(/-/g, ''),
                    address: address || ''
                }

                // Check existence
                const existing = await tx.client.findUnique({
                    where: { userId_cuit_address: uniqueInput }
                })

                if (existing) {
                    // Update
                    await tx.client.update({
                        where: { id: existing.id },
                        data: {
                            name,
                            docType: docType || '80',
                            email: email || '',
                            phone: phone || '',
                            ivaCondition: ivaCondition || 'Consumidor Final',
                        }
                    })

                    // Update items if provided (assuming full sync capability)
                    if (equipments && equipments.length >= 0) {
                        try {
                            // Delete old items
                            await tx.clientEquipment.deleteMany({
                                where: { clientId: existing.id }
                            })
                            // Create new items
                            if (equipments.length > 0) {
                                await tx.clientEquipment.createMany({
                                    data: equipments.map((eq: any) => ({
                                        clientId: existing.id,
                                        type: eq.type || 'Ascensor',
                                        quantity: Number(eq.quantity) || 1,
                                        price: Number(eq.price) || 0
                                    }))
                                })
                            }
                        } catch (itemError) {
                            console.error("Error syncing items for client " + name, itemError)
                        }
                    }
                } else {
                    // Create
                    await tx.client.create({
                        data: {
                            userId: session.userId,
                            name,
                            docType: docType || '80',
                            cuit: cuit.replace(/-/g, ''),
                            address: address || '',
                            email: email || '',
                            phone: phone || '',
                            ivaCondition: ivaCondition || 'Consumidor Final',
                            items: {
                                create: equipments.map((eq: any) => ({
                                    type: eq.type || 'Ascensor',
                                    quantity: Number(eq.quantity) || 1,
                                    price: Number(eq.price) || 0
                                }))
                            }
                        }
                    })
                }
            })
            successCount++
        }

        return NextResponse.json({ success: true, count: successCount })
    } catch (e) {
        console.error(e)
        return new NextResponse('Error processing file', { status: 500 })
    }
}
