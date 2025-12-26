'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// Schema definition
const ClientSchema = z.object({
    name: z.string().min(1, "El nombre del edificio es obligatorio"),
    docType: z.string().default('80'),
    // Relaxed CUIT validation: Optional or empty allowed. If provided, must be numbers.
    cuit: z.string().regex(/^\d*$/, "Solo números").optional().or(z.literal('')),
    address: z.string().optional(),
    ivaCondition: z.string().min(1, "Seleccione la condición frente al IVA"),
    email: z.string().email("Email inválido").optional().or(z.literal('')),
    phone: z.string().optional(),
    priceUpdateFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'SEMIANNUAL', 'NO']).optional().default('MONTHLY'),
    lastPriceUpdate: z.string().optional(),
    items: z.string().optional(),
    clientNumber: z.coerce.number().optional(), // Coerce from string if form data
})

export async function getClients(query?: string) {
    const session = await verifySession()
    if (!session) return []

    const where: any = { userId: session.userId }

    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { cuit: { contains: query } }
        ]
    }

    const clients = await db.client.findMany({
        where,
        include: { items: true },
        orderBy: [
            { clientNumber: 'asc' },
            { name: 'asc' }
        ]
    })

    return clients
}

// ... existing actions ...

export async function updateClientNumber(clientId: string, newNumber: number | null) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        await db.client.update({
            where: {
                id: clientId,
                userId: session.userId
            },
            data: { clientNumber: newNumber }
        })

        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating client number:", error)
        return { success: false, message: error.message }
    }
}

export async function createClient(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const data = Object.fromEntries(formData)
    const result = ClientSchema.safeParse(data)

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors }
    }

    const items = result.data.items ? JSON.parse(result.data.items) : []
    const lastPriceUpdateDate = result.data.lastPriceUpdate ? new Date(result.data.lastPriceUpdate) : null

    // Default CUIT to '0' if empty
    const finalCuit = (!result.data.cuit || result.data.cuit.trim() === '') ? '0' : result.data.cuit

    // Validation: Strict CUIT requirement for specific tax conditions
    const needsCuit = ['Responsable Inscripto', 'Monotributo', 'Exento'].includes(result.data.ivaCondition)
    if (needsCuit && (result.data.docType === '99' || finalCuit === '0' || finalCuit.length !== 11)) {
        return { message: `Para la condición '${result.data.ivaCondition}', se requiere un CUIT válido.` }
    }



    try {
        await db.client.create({
            data: {
                userId: session.userId,
                name: result.data.name,
                docType: result.data.docType,
                cuit: finalCuit,
                address: result.data.address,
                ivaCondition: result.data.ivaCondition,
                email: result.data.email,
                phone: result.data.phone,
                priceUpdateFrequency: result.data.priceUpdateFrequency,
                lastPriceUpdate: lastPriceUpdateDate,
                items: {
                    create: items.map((item: any) => ({
                        type: item.type,
                        quantity: Number(item.quantity),
                        price: Number(item.price)
                    }))
                },
                clientNumber: result.data.clientNumber || null,
            }
        })
        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error: any) {
        console.error(error)
        if (error.code === 'P2002') {
            return { message: 'Ya existe un cliente con ese CUIT y Dirección.' }
        }
        return { message: 'Error al crear cliente.' }
    }
}

export async function deleteClient(id: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        await db.$transaction(async (tx) => {
            // Delete dependencies manually to avoid FK errors if DB cascade is missing
            const where = { clientId: id }
            await tx.receipt.deleteMany({ where })
            await tx.invoiceItem.deleteMany({ where: { invoice: { clientId: id } } }) // Delete invoice items first
            await tx.invoice.deleteMany({ where: { clientId: id } }) // Then invoices
            await tx.maintenanceVisit.deleteMany({ where })
            await tx.maintenanceTask.deleteMany({ where })
            await tx.equipment.deleteMany({ where })
            await tx.clientEquipment.deleteMany({ where })
            await tx.priceHistory.deleteMany({ where })

            await tx.client.delete({
                where: {
                    id,
                    userId: session.userId
                }
            })
        })
        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error) {
        console.error("Error deleting client:", error)
        return { message: 'Error al eliminar cliente' }
    }
}

export async function deleteClients(ids: string[]) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        await db.$transaction(async (tx) => {
            const where = { clientId: { in: ids } }
            const userId = session.userId

            // 1. Delete Receipts
            await tx.receipt.deleteMany({
                where: {
                    clientId: { in: ids },
                    userId
                }
            })

            // 2. Delete Invoices (and items via cascade or manual if strictly needed, but normally items cascade from invoice)
            // Ideally we delete invoice items if needed, but usually invoice->items is set to cascade.
            // But Invoice->Client wasn't.
            // Let's safe delete invoices.
            await tx.invoice.deleteMany({
                where: {
                    clientId: { in: ids },
                    userId
                }
            })

            // 3. Other dependencies
            await tx.maintenanceVisit.deleteMany({ where })
            await tx.maintenanceTask.deleteMany({ where })
            await tx.equipment.deleteMany({ where })
            await tx.clientEquipment.deleteMany({ where })
            await tx.priceHistory.deleteMany({ where })

            // 4. Delete clients
            await tx.client.deleteMany({
                where: {
                    id: { in: ids },
                    userId
                }
            })
        })

        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting clients:", error)
        return { message: error.message || 'Error al eliminar clientes' }
    }
}

export async function updateClient(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const data = Object.fromEntries(formData)
    const clientId = formData.get('id') as string

    if (!clientId) return { message: 'ID de cliente faltante' }

    const result = ClientSchema.safeParse(data)

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors }
    }

    const items = result.data.items ? JSON.parse(result.data.items) : []
    const lastPriceUpdateDate = result.data.lastPriceUpdate ? new Date(result.data.lastPriceUpdate) : null

    // Default CUIT to '0' if empty
    const finalCuit = (!result.data.cuit || result.data.cuit.trim() === '') ? '0' : result.data.cuit

    try {
        // Transaction to update client and replace items
        await db.$transaction(async (tx) => {
            await tx.client.update({
                where: { id: clientId, userId: session.userId },
                data: {
                    name: result.data.name,
                    docType: result.data.docType,
                    cuit: finalCuit,
                    address: result.data.address,
                    ivaCondition: result.data.ivaCondition,
                    email: result.data.email,
                    phone: result.data.phone,
                    priceUpdateFrequency: result.data.priceUpdateFrequency,
                    lastPriceUpdate: lastPriceUpdateDate,
                    clientNumber: result.data.clientNumber || null,
                }
            })

            // Replace items: Delete all and create new
            await tx.clientEquipment.deleteMany({
                where: { clientId }
            })

            if (items.length > 0) {
                await tx.clientEquipment.createMany({
                    data: items.map((item: any) => ({
                        clientId,
                        type: item.type,
                        quantity: Number(item.quantity),
                        price: Number(item.price)
                    }))
                })
            }
        })

        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { message: 'Error al actualizar cliente' }
    }
}

export async function updateClientPrice(clientId: string, newPrice: number) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        const items = await db.clientEquipment.findMany({
            where: { clientId }
        })

        if (items.length === 0) {
            // Create default item if none exists
            await db.clientEquipment.create({
                data: {
                    clientId,
                    type: 'Abono de Servicio',
                    quantity: 1,
                    price: newPrice
                }
            })
        } else {
            // Update the first item (Primary subscription)
            // If there are multiple, we update the first one as it's the most logical place for the "Base" price.
            await db.clientEquipment.update({
                where: { id: items[0].id },
                data: { price: newPrice }
            })
        }

        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating price:", error)
        return { success: false, message: error.message }
    }
}

export async function updateClientName(clientId: string, newName: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    if (!newName || newName.trim().length === 0) {
        return { success: false, message: 'El nombre no puede estar vacío' }
    }

    try {
        await db.client.update({
            where: {
                id: clientId,
                userId: session.userId
            },
            data: { name: newName }
        })

        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating name:", error)
        return { success: false, message: error.message }
    }
}

export async function updateClientAddress(clientId: string, newAddress: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        await db.client.update({
            where: {
                id: clientId,
                userId: session.userId
            },
            data: { address: newAddress }
        })

        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating address:", error)
        return { success: false, message: error.message }
    }
}

export async function toggleClientStatus(ids: string[], isActive: boolean) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    if (!ids || ids.length === 0) return { success: false, message: 'No se seleccionaron clientes' }

    try {
        await db.client.updateMany({
            where: {
                id: { in: ids },
                userId: session.userId
            },
            data: { isActive }
        })

        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error: any) {
        console.error("Error toggling status:", error)
        return { success: false, message: error.message }
    }
}

export async function updateClientFrequency(clientId: string, frequency: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const validFrequencies = ['MONTHLY', 'QUARTERLY', 'YEARLY', 'SEMIANNUAL', 'NO']
    if (!validFrequencies.includes(frequency)) {
        return { success: false, message: 'Frecuencia inválida' }
    }

    try {
        await db.client.update({
            where: {
                id: clientId,
                userId: session.userId
            },
            data: { priceUpdateFrequency: frequency }
        })
        revalidatePath('/dashboard/clients')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating frequency:", error)
        return { success: false, message: error.message }
    }
}
