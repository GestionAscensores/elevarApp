'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getProductByBarcode(barcode: string) {
    const session = await verifySession()
    if (!session) return { error: 'No autorizado' }

    try {
        const product = await db.product.findFirst({
            where: {
                userId: session.userId,
                // Match either barcode OR code (if user scanned a code that matches the SKU)
                OR: [
                    { barcode: barcode },
                    { code: barcode }
                ]
            }
        })
        return { product }
    } catch (error) {
        console.error('Error finding product:', error)
        return { error: 'Error al buscar producto' }
    }
}

export async function updateProductStock(id: string, delta: number) {
    const session = await verifySession()
    if (!session) return { error: 'No autorizado' }

    try {
        const product = await db.product.update({
            where: { id, userId: session.userId },
            data: {
                stock: { increment: delta }
            }
        })
        revalidatePath('/dashboard/inventory/scan')
        return { success: true, newStock: product.stock }
    } catch (error) {
        console.error('Error updating stock:', error)
        return { error: 'Error al actualizar stock' }
    }
}

export async function updateProductImage(id: string, base64Image: string) {
    const session = await verifySession()
    if (!session) return { error: 'No autorizado' }

    try {
        await db.product.update({
            where: { id, userId: session.userId },
            data: {
                imageUrl: base64Image
            }
        })
        revalidatePath('/dashboard/inventory/scan')
        revalidatePath('/dashboard/pricing')
        return { success: true }
    } catch (error) {
        console.error('Error updating image:', error)
        return { error: 'Error al guardar imagen' }
    }
}

export async function deleteProductImage(id: string) {
    const session = await verifySession()
    if (!session) return { error: 'No autorizado' }

    try {
        await db.product.update({
            where: { id, userId: session.userId },
            data: {
                imageUrl: null // Clear image
            }
        })
        revalidatePath('/dashboard/inventory/scan')
        revalidatePath('/dashboard/pricing')
        return { success: true }
    } catch (error) {
        return { error: 'Error al eliminar imagen' }
    }
}

export async function setProductBarcode(id: string, barcode: string) {
    const session = await verifySession()
    if (!session) return { error: 'No autorizado' }

    try {
        await db.product.update({
            where: { id, userId: session.userId },
            data: { barcode }
        })
        return { success: true }
    } catch (error) {
        return { error: 'Error al asignar código de barras' }
    }
}

export async function createInventoryProduct(data: {
    barcode: string
    name: string
    price: number
    stock: number
}) {
    const session = await verifySession()
    if (!session) return { error: 'No autorizado' }

    try {
        const product = await db.product.create({
            data: {
                userId: session.userId,
                name: data.name,
                price: data.price,
                stock: data.stock,
                barcode: data.barcode,
                currency: 'ARS', // Default
                ivaRate: '21',   // Default
            }
        })
        revalidatePath('/dashboard/inventory/scan')
        return { success: true, product }
    } catch (error) {
        console.error('Error creating product:', error)
        return { error: 'Error al crear producto' }
    }
}
