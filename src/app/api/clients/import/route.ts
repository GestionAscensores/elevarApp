
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

        const fileContentBody = await file.text()


        // Robust CSV Parser (State Machine) to handle newlines inside quotes
        const parseCSV = (str: string) => {
            const arr = []
            let quote = false
            let col = ''
            let row = []

            for (let c = 0; c < str.length; c++) {
                const cc = str[c]
                const nc = str[c + 1]

                if (cc === '"') {
                    if (quote && nc === '"') {
                        // Escaped quote
                        col += '"'
                        c++
                    } else {
                        // Toggle quote status
                        quote = !quote
                    }
                } else if (cc === ',' && !quote) {
                    // End of column
                    row.push(col)
                    col = ''
                } else if ((cc === '\r' || cc === '\n') && !quote) {
                    // End of row
                    // Handle \r\n vs \n
                    if (cc === '\r' && nc === '\n') { c++ }

                    row.push(col)
                    arr.push(row)
                    row = []
                    col = ''
                } else {
                    col += cc
                }
            }
            // Push last row if exists
            if (row.length > 0 || col.length > 0) {
                row.push(col)
                arr.push(row)
            }
            return arr
        }

        const rows = parseCSV(fileContentBody)
        let successCount = 0
        let errorCount = 0

        // Skip header row (index 0)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (!row || row.length < 2) continue

            // Ensure we map columns correctly based on Export order:
            // ['Nro Cliente', 'Nombre', 'Tipo Doc', 'Documento', 'Direccion', 'Email', 'Telefono', 'Condicion IVA', 'Equipos', 'Bitacora', 'Facturas', 'Historial Precios']
            // Note: The loop below destructures assuming this exact order.

            const [clientNumberStr, name, docType, cuit, address, email, phone, ivaCondition, itemsJson, equipmentJson, invoicesJson, pricesJson] = row

            if (!name || !cuit) {
                errorCount++
                continue
            }

            const clientNumber = clientNumberStr ? parseInt(clientNumberStr) : null

            let billingItems = []
            let bitacora = []
            let priceHistory = []

            try {
                if (itemsJson) billingItems = JSON.parse(itemsJson)
                if (equipmentJson) bitacora = JSON.parse(equipmentJson) // Equipment + Visits
                if (pricesJson) priceHistory = JSON.parse(pricesJson)
            } catch (e) {
                console.error("Error parsing JSON columns", e)
            }

            // Find or Create Default Technician for History (to avoid FK errors)
            let defaultTech = await db.technician.findFirst({ where: { userId: session.userId } })
            if (!defaultTech) {
                // If no tech exists, create a placeholder one for historical data
                try {
                    defaultTech = await db.technician.create({
                        data: {
                            userId: session.userId,
                            name: 'Historial Importado',
                            pin: '0000',
                            isActive: false
                        }
                    })
                } catch (e) {
                    console.error("Could not create default tech", e)
                }
            }
            const fallbackTechId = defaultTech?.id

            // Transactional update/create
            await db.$transaction(async (tx) => {
                const uniqueInput = {
                    userId: session.userId,
                    cuit: cuit.replace(/-/g, ''),
                    address: address || ''
                }

                // Check existence
                let client = await tx.client.findUnique({
                    where: { userId_cuit_address: uniqueInput }
                })

                if (client) {
                    // Update main data
                    client = await tx.client.update({
                        where: { id: client.id },
                        data: {
                            name,
                            clientNumber: clientNumber || undefined,
                            docType: docType || '80',
                            email: email || '',
                            phone: phone || '',
                            ivaCondition: ivaCondition || 'Consumidor Final',
                        }
                    })
                } else {
                    // Create new client
                    client = await tx.client.create({
                        data: {
                            userId: session.userId,
                            name,
                            clientNumber,
                            docType: docType || '80',
                            cuit: cuit.replace(/-/g, ''),
                            address: address || '',
                            email: email || '',
                            phone: phone || '',
                            ivaCondition: ivaCondition || 'Consumidor Final',
                        }
                    })
                }

                // 1. Sync Billing Items (ClientEquipment)
                if (billingItems && billingItems.length >= 0) {
                    await tx.clientEquipment.deleteMany({ where: { clientId: client.id } })
                    if (billingItems.length > 0) {
                        await tx.clientEquipment.createMany({
                            data: billingItems.map((eq: any) => ({
                                clientId: client.id,
                                type: eq.type || 'Ascensor',
                                quantity: Number(eq.quantity) || 1,
                                price: Number(eq.price) || 0
                            }))
                        })
                    }
                }

                // 2. Sync Bitacora (Equipment + Visits)
                if (bitacora && bitacora.length > 0) {
                    for (const eq of bitacora) {
                        // Strategy: Upsert by QR Code (unique) or Name+Client
                        let exists = null
                        if (eq.qrCode) {
                            exists = await tx.equipment.findFirst({ where: { qrCode: eq.qrCode } })
                        }
                        if (!exists) {
                            exists = await tx.equipment.findFirst({
                                where: { clientId: client.id, name: eq.name }
                            })
                        }

                        let equipmentId = exists?.id

                        if (exists) {
                            await tx.equipment.update({
                                where: { id: exists.id },
                                data: {
                                    type: eq.type,
                                    description: eq.description,
                                    installDate: eq.installDate ? new Date(eq.installDate) : undefined
                                }
                            })
                        } else {
                            // Create new
                            const newEq = await tx.equipment.create({
                                data: {
                                    clientId: client.id,
                                    name: eq.name,
                                    type: eq.type,
                                    status: eq.status || 'OPERATIVE',
                                    qrCode: eq.qrCode || Math.random().toString(36).substring(7),
                                    description: eq.description,
                                    installDate: eq.installDate ? new Date(eq.installDate) : null
                                } as any
                            })
                            equipmentId = newEq.id
                        }

                        // Restore Visits if present
                        // Only proceed if we have a valid technician ID (fallback)
                        if (equipmentId && eq.visits && eq.visits.length > 0 && fallbackTechId) {
                            const visitsToCreate = eq.visits.map((v: any) => ({
                                clientId: client.id,
                                equipmentId: equipmentId,
                                date: new Date(v.date),
                                type: v.type,
                                status: v.status,
                                publicNotes: v.publicNotes,
                                privateNotes: v.privateNotes,
                                proofUrl: v.proofUrl,
                                technicianId: fallbackTechId // Use fallback to satisfy FK constraint
                            }))

                            try {
                                await tx.maintenanceVisit.createMany({
                                    data: visitsToCreate as any
                                })
                            } catch (e) {
                                console.warn("Skipped visits import due to existance/error", e)
                            }
                        }
                    }
                }

                // Note: Skipping Invoice/Visit import details to ensure stability. 
                // Exporting them gives the USER the data (Backup). Importing complex relational data via CSV is risky without ID mapping.
            })
            successCount++
        }

        return NextResponse.json({ success: true, count: successCount })
    } catch (e) {
        console.error(e)
        return new NextResponse('Error processing file', { status: 500 })
    }
}
