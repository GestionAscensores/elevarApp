'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { createInvoice } from './billing'

const MassInvoiceSchema = z.object({
    clientIds: z.string(), // JSON array of strings
    items: z.string(), // JSON array of items (common structure)
    useClientFee: z.string().optional(), // "on" or undefined
    date: z.string().optional(),
})

export async function createMassInvoices(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const data = Object.fromEntries(formData)
    const result = MassInvoiceSchema.safeParse(data)

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors }
    }

    const clientIds = JSON.parse(result.data.clientIds) as string[]
    const itemsTemplate = JSON.parse(result.data.items) // Array of items
    const useClientFee = result.data.useClientFee === 'on'

    const results = {
        successCount: 0,
        failCount: 0,
        errors: [] as string[]
    }

    const config = await db.userConfig.findUnique({ where: { userId: session.userId } })
    if (!config) return { message: 'Falta configuración de punto de venta.' }

    const ptoVta = config.salePoint

    for (const clientId of clientIds) {
        try {
            const client = await db.client.findUnique({
                where: { id: clientId },
                include: { items: true } // Fetch equipment
            })
            if (!client) continue;

            const type = client.ivaCondition === 'Responsable Inscripto' ? 'A' : 'C'

            const dateObj = result.data.date ? new Date(result.data.date + '-05') : new Date(); // YYYY-MM format?
            // Actually result.data.date comes from type="month" input usually, so 'YYYY-MM'.
            // Let's ensure we parse it right.
            const [year, month] = (result.data.date || new Date().toISOString().slice(0, 7)).split('-').map(Number);

            // Service Dates
            const serviceFrom = new Date(year, month - 1, 1);
            const serviceTo = new Date(year, month, 0); // Last day of month

            // Payment Due: Last day of CURRENT month
            const now = new Date();
            const paymentDue = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // Month Name for Description (Needed for Equipment Description generation)
            const monthName = serviceFrom.toLocaleString('es-AR', { month: 'long' });
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

            const selectedIva = itemsTemplate[0]?.ivaRate || 21

            // Prepare Items
            let invoiceItems = []

            if (useClientFee) {
                if (client.items && client.items.length > 0) {
                    invoiceItems = client.items.map((eq: any) => {
                        // "tareas de manteniento correspondietes un equipo (descripto en clientes) al mes de ...(mes seleccionado)"
                        return {
                            // "Servicio de Mantenimiento - Tipo - Mes"
                            description: `Servicio de Mantenimiento - ${eq.type} - ${capitalizedMonth}`,
                            quantity: eq.quantity,
                            price: eq.price,
                            ivaRate: Number(selectedIva)
                        }
                    })
                } else {
                    // Fallback if no equipment?
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

            // Calculate Totals (Draft calculation)
            let impNeto = 0
            let impIVA = 0
            let impTotal = 0

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
            impTotal = impNeto + impIVA

            // Draft Number? 0 for now.
            // CAI/CAE null.

            await db.invoice.create({
                data: {
                    userId: session.userId,
                    clientId,
                    type,
                    pointOfSale: ptoVta,
                    number: 0, // 0 indicates draft/unassigned
                    date: new Date(),
                    status: 'DRAFT',
                    netAmount: impNeto,
                    ivaAmount: impIVA,
                    totalAmount: impTotal,
                    concept: 2, // Servicios
                    serviceFrom,
                    serviceTo,
                    paymentDue, // Optional but good to have
                    paymentCondition: 'Transferencia', // Default requested
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
