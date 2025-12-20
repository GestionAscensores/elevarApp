'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

const ProductSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    code: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
    currency: z.enum(["ARS", "USD"]),
    ivaRate: z.string().optional().default("21"),
})

export async function getProducts() {
    const session = await verifySession()
    if (!session) return []

    const products = await db.product.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' }
    })

    return products.map(p => ({
        ...p,
        price: p.price.toNumber() // Convert Decimal to number for serialization
    }))
}

export async function createProduct(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const data = Object.fromEntries(formData)
    const result = ProductSchema.safeParse(data)

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors }
    }

    try {
        const product = await db.product.create({
            data: {
                userId: session.userId,
                name: result.data.name,
                code: result.data.code,
                description: result.data.description,
                price: result.data.price,
                currency: result.data.currency,
                ivaRate: result.data.ivaRate,
            }
        })
        revalidatePath('/dashboard/pricing')
        return {
            success: true,
            product: {
                ...product,
                price: product.price.toNumber()
            }
        }
    } catch (error) {
        console.error(error)
        return { message: 'Error al crear producto.' }
    }
}

export async function updateProduct(id: string, prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const data = Object.fromEntries(formData)
    const result = ProductSchema.safeParse(data)

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors }
    }

    try {
        await db.product.update({
            where: { id, userId: session.userId },
            data: {
                name: result.data.name,
                code: result.data.code,
                description: result.data.description,
                price: result.data.price,
                currency: result.data.currency,
                ivaRate: result.data.ivaRate,
            }
        })
        revalidatePath('/dashboard/pricing')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { message: 'Error al actualizar producto.' }
    }
}

export async function deleteProduct(id: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        // Check for dependencies (Invoices)
        // Prisma relies on OnDelete: Cascade or Restrict.
        // If we want to prevent deletion if invoices exist:
        const usage = await db.invoiceItem.findFirst({
            where: { productId: id }
        })

        if (usage) {
            return { message: 'No se puede eliminar: El producto está en uso en facturas existentes.' }
        }

        await db.product.delete({
            where: {
                id,
                userId: session.userId
            }
        })
        revalidatePath('/dashboard/pricing')
        return { success: true }
    } catch (error) {
        return { message: 'Error al eliminar producto' }
    }
}

export async function updateProductPrice(id: string, newPrice: number) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        await db.product.update({
            where: { id, userId: session.userId },
            data: { price: newPrice }
        })
        revalidatePath('/dashboard/pricing')
        return { success: true }
    } catch (error) {
        return { message: 'Error al actualizar precio' }
    }
}

export async function updateProductName(id: string, newName: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    if (!newName || newName.trim().length === 0) return { message: 'El nombre no puede estar vacío' }

    try {
        await db.product.update({
            where: { id, userId: session.userId },
            data: { name: newName }
        })
        revalidatePath('/dashboard/pricing')
        return { success: true }
    } catch (error) {
        return { message: 'Error al actualizar nombre' }
    }
}
