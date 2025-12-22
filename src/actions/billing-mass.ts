'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

const MassInvoiceSchema = z.object({
    clientIds: z.string(), // JSON array of strings
    items: z.string(), // JSON array of items (common structure)
    useClientFee: z.string().optional(), // "on" or undefined
    date: z.string().optional(),
})

export async function createMassInvoices(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { success: false, message: 'No autorizado' }

    const data = Object.fromEntries(formData)
    const result = MassInvoiceSchema.safeParse(data)

    if (!result.success) {
        return { success: false, errors: result.error.flatten().fieldErrors, message: 'Datos inválidos' }
    }

    const clientIds = JSON.parse(result.data.clientIds) as string[]
    // If specific date provided, use it. Else default to current.
    // formData date is usually "YYYY-MM"
    const [year, month] = (result.data.date || new Date().toISOString().slice(0, 7)).split('-').map(Number);

    return createMassInvoicesAction(session.userId, clientIds, result.data.useClientFee === 'on', result.data.items, year, month)
}

async function createMassInvoicesAction(userId: string, clientIds: string[], useClientFee: boolean, itemsTemplateJson: string, year: number, month: number) {
    const itemsTemplate = JSON.parse(itemsTemplateJson)

    const results = {
        successCount: 0,
        failCount: 0,
        errors: [] as string[]
    }

    const config = await db.userConfig.findUnique({ where: { userId } })
    if (!config) return { success: false, message: 'Falta configuración de punto de venta.' }

    const ptoVta = config.salePoint

    for (const clientId of clientIds) {
        try {
            const client = await db.client.findUnique({
                where: { id: clientId },
                include: { items: true } // Fetch equipment
            })
            if (!client) continue;

            const type = client.ivaCondition === 'Responsable Inscripto' ? 'A' : 'C'

            // Service Dates
            const serviceFrom = new Date(year, month - 1, 1);
            const serviceTo = new Date(year, month, 0); // Last day of month

            // Payment Due: Last day of CURRENT month (Emission Month)
            // Fixes AFIP 10036: Payment Due cannot be before Invoice Date.
            const now = new Date();
            const invoiceDate = new Date(); // Today
            const paymentDue = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // Month Name
            const monthName = serviceFrom.toLocaleString('es-AR', { month: 'long' });
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

            const selectedIva = itemsTemplate[0]?.ivaRate || 21

            // Prepare Items
            let invoiceItems = []

            if (useClientFee) {
                if (client.items && client.items.length > 0) {
                    invoiceItems = client.items.map((eq: any) => {
                        return {
                            description: `Servicio de Mantenimiento - ${eq.type} - ${capitalizedMonth}`,
                            quantity: eq.quantity,
                            price: eq.price,
                            ivaRate: Number(selectedIva)
                        }
                    })
                } else {
                    const templateItem = itemsTemplate[0] || { description: 'Abono', ivaRate: 21, price: 0 }
                    invoiceItems = [{
                        ...templateItem,
                        description: templateItem.description,
                        price: 0
                    }]
                }
            } else {
                invoiceItems = itemsTemplate.map((item: any) => ({
                    ...item,
                    description: item.description,
                    price: 0
                }))
            }

            // Calculate Totals
            let impNeto = 0
            let impIVA = 0
            for (const item of invoiceItems) {
                const q = Number(item.quantity)
                const p = Number(item.price)
                const sub = q * p
                const rate = Number(item.ivaRate)

                if (type === 'C') {
                    impNeto += sub
                } else {
                    impNeto += sub
                    impIVA += sub * (rate / 100)
                }
            }
            const impTotal = impNeto + impIVA

            await db.invoice.create({
                data: {
                    userId,
                    clientId,
                    type,
                    pointOfSale: ptoVta,
                    number: 0,
                    date: new Date(),
                    status: 'DRAFT',
                    netAmount: impNeto,
                    ivaAmount: impIVA,
                    totalAmount: impTotal,
                    concept: 2,
                    serviceFrom,
                    serviceTo,
                    paymentDue,
                    paymentCondition: 'Transferencia',
                    items: {
                        create: invoiceItems.map((item: any) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.price,
                            subtotal: item.quantity * item.price,
                            ivaRate: item.ivaRate
                        }))
                    }
                }
            })

            results.successCount++

        } catch (e: any) {
            results.failCount++
            results.errors.push(`Cliente ${clientId}: ${e.message}`)
        }
    }

    revalidatePath('/dashboard/billing')

    if (results.failCount === 0) {
        return { success: true, message: `Se generaron ${results.successCount} borradores correctamente.` }
    } else {
        return { success: false, message: `Generados: ${results.successCount}. Fallidos: ${results.failCount}`, errors: results.errors }
    }
}

export async function generateAutoBillingInternal(userId: string) {
    // 1. Get all clients not excluded
    const clients = await db.client.findMany({
        where: { userId, excludeFromMassUpdate: false },
        select: { id: true }
    })

    if (clients.length === 0) return { success: true, count: 0 }

    const clientIds = clients.map(c => c.id)

    // 2. Determine Dates (Previous Month - Mes Vencido)
    const now = new Date()
    const billingDate = new Date(now)
    billingDate.setMonth(now.getMonth() - 1) // Go back 1 month

    const year = billingDate.getFullYear()
    const month = billingDate.getMonth() + 1 // 1-12

    // 3. Mock Items Template (Standard 21%)
    const mockItems = JSON.stringify([{ description: 'Abono', ivaRate: 21, price: 0 }])

    // Cleanup: Delete existing DRAFTS for this period (Service From)
    // To ensure idempotency and prevent duplicates if run multiple times.
    const serviceFrom = new Date(year, month - 1, 1);

    await db.invoice.deleteMany({
        where: {
            userId,
            status: 'DRAFT',
            serviceFrom: serviceFrom,
            // Only delete drafts for the clients we are about to bill? 
            // Or all auto-generated ones? 
            // Safest: Delete drafts for the specific clients involved in this run.
            clientId: { in: clientIds }
        }
    })

    // 4. Call Shared Action
    // useClientFee = true
    return createMassInvoicesAction(userId, clientIds, true, mockItems, year, month)
}

export async function updateAutoBillingConfig(formData: FormData) {
    const session = await verifySession()
    if (!session) return { success: false, message: 'No autorizado' }

    const autoBillingEnabled = formData.get('autoBillingEnabled') === 'on'
    const autoBillingDay = Number(formData.get('autoBillingDay')) || 1
    const selectedClientsJson = formData.get('selectedClients') as string

    let selectedClients: string[] = []
    try {
        selectedClients = JSON.parse(selectedClientsJson)
    } catch (e) {
        return { success: false, message: 'Error en lista de clientes' }
    }

    try {
        // 1. Update User Config
        // @ts-ignore - Prisma types update pending
        await db.userConfig.upsert({
            where: { userId: session.userId },
            create: {
                userId: session.userId,
                autoBillingEnabled,
                autoBillingDay
            },
            update: {
                autoBillingEnabled,
                autoBillingDay
            }
        })

        // 2. Update all clients Exclude Status
        await db.$transaction([
            // Exclude ALL first (reset)
            db.client.updateMany({
                where: { userId: session.userId },
                data: { excludeFromMassUpdate: true }
            }),
            // Include Selected (if any)
            ...(selectedClients.length > 0 ? [db.client.updateMany({
                where: {
                    userId: session.userId,
                    id: { in: selectedClients }
                },
                data: { excludeFromMassUpdate: false }
            })] : [])
        ])

        return { success: true, message: 'Configuración actualizada correctamente' }
    } catch (error: any) {
        console.error('Error updating auto billing:', error)
        return { success: false, message: `Error interno: ${error.message}` }
    }
}
