'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { authorizeInvoice, getLastVoucher } from '@/lib/afip/wsfe'
import { redirect } from 'next/navigation'

// Schema for simple single-item invoice for now, or multi-item.
// We expect a JSON string for items or form array.
// For simplicity in this action, we'll parse a JSON string 'items'.
const InvoiceSchema = z.object({
    clientId: z.string().min(1, "Seleccione un cliente"),
    type: z.string().min(1), // Factura A, B, C... (Mapped to AFIP codes later: 1, 6, 11)
    condition: z.string().optional(),

    items: z.string().min(1), // JSON array of { productId, description, quantity, price, ivaRate }
    // AFIP Extras
    concepto: z.coerce.number().min(1).optional(), // 1, 2, 3
    serviceFrom: z.string().optional(), // YYYY-MM-DD
    serviceTo: z.string().optional(), // YYYY-MM-DD
    paymentDue: z.string().optional(), // YYYY-MM-DD
    paymentCondition: z.string().optional(),
    isQuote: z.string().optional(),
})

const AFIP_INVOICE_TYPES: Record<string, number> = {
    'A': 1,
    'B': 6,
    'C': 11,
    'M': 51,
    'E': 19,
    'NCA': 3,
    'NCB': 8,
    'NCC': 13
}

const IVA_RATES: Record<string, number> = {
    '21': 5,
    '10.5': 4,
    '0': 3,
    '27': 6,
    '5': 8,
    '2.5': 9
}

export async function createInvoice(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const data = Object.fromEntries(formData)
    const result = InvoiceSchema.safeParse(data)

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors }
    }

    const { clientId, type, items: itemsJson, concepto = 1, serviceFrom, serviceTo, paymentDue, paymentCondition = 'Transferencia' } = result.data
    const items = JSON.parse(itemsJson)

    // Check if saving as draft
    const isDraft = formData.get('isDraft') === 'true'

    // 1. Get User Config for Point of Sale (Required even for Draft to show likely number? No, just checking access)
    const config = await db.userConfig.findUnique({ where: { userId: session.userId } })
    if (!config) return { message: 'Falta configuración de usuario (Punto de Venta)' }

    const ptoVta = config.salePoint

    // 2. Get Client
    const client = await db.client.findUnique({ where: { id: clientId } })
    if (!client) return { message: 'Cliente no encontrado' }

    // 3. Calculate Totals
    let impNeto = 0
    let impIVA = 0
    let impTotal = 0
    const ivasMap = new Map<number, { baseImp: number, importe: number }>()

    // Iterate items
    for (const item of items) {
        const quantity = Number(item.quantity)
        const price = Number(item.price)
        const subtotal = quantity * price
        const ivaRate = Number(item.ivaRate)

        if (type === 'C') {
            impNeto += subtotal
        } else {
            impNeto += subtotal
            const ivaItem = subtotal * (ivaRate / 100)
            impIVA += ivaItem

            const afipIvaId = IVA_RATES[String(ivaRate)] || 3

            if (afipIvaId !== 3) {
                const current = ivasMap.get(afipIvaId) || { baseImp: 0, importe: 0 }
                current.baseImp += subtotal
                current.importe += ivaItem
                ivasMap.set(afipIvaId, current)
            }
        }
    }

    impTotal = impNeto + impIVA

    // IF DRAFT, SAVE AND RETURN
    if (isDraft) {
        try {
            await db.invoice.create({
                data: {
                    userId: session.userId,
                    clientId,
                    type,
                    pointOfSale: ptoVta,
                    number: 0, // Drafts have 0 or handle separately
                    date: new Date(),
                    concept: 1, // Default Productos
                    serviceFrom: serviceFrom ? new Date(serviceFrom) : null,
                    serviceTo: serviceTo ? new Date(serviceTo) : null,
                    paymentDue: paymentDue ? new Date(paymentDue) : null,
                    paymentCondition,
                    netAmount: impNeto,
                    ivaAmount: impIVA,
                    totalAmount: impTotal,
                    status: 'DRAFT',
                    items: {
                        create: items.map((i: any) => ({
                            productId: i.productId !== 'custom' ? i.productId : undefined,
                            description: i.description,
                            quantity: Number(i.quantity),
                            unitPrice: Number(i.price),
                            ivaRate: Number(i.ivaRate),
                            subtotal: Number(i.quantity) * Number(i.price)
                        }))
                    }
                }
            })
            revalidatePath('/dashboard/billing')
            return { success: true, successMessage: 'Borrador guardado correctamente' }
        } catch (e: any) {
            return { message: 'Error al guardar borrador: ' + e.message }
        }
    }

    // ... continue to AFIP logic if not draft ...
    const cbteTipo = AFIP_INVOICE_TYPES[type] || 11

    // Map IVA Condition to AFIP Code (RG 5616)
    // 1=RI, 6=Mono, 4=Exento, 5=CF, etc.
    // We send this as Opcional ID 27 ? Probably. 
    // Or ID 23? Let's trying ID 27 first.
    let conditionCode = 5 // Default Consumidor Final
    const cond = (client.ivaCondition || '').toLowerCase()

    if (cond.includes('inscripto')) conditionCode = 1
    else if (cond.includes('monotributo')) conditionCode = 6
    else if (cond.includes('exento')) conditionCode = 4
    else if (cond.includes('consumidor')) conditionCode = 5

    const conditionOpcional = { id: 27, valor: String(conditionCode) }
    // If ID 27 fails, try ID 23.

    // Determine DocTipo and DocNro
    const cleanCuit = client.cuit.trim().replace(/\D/g, '')
    let docTipo = 80 // CUIT
    let docNro = cleanCuit

    const isConsumidorFinal = (client.ivaCondition || '').toLowerCase().includes('consumidor')

    if (isConsumidorFinal) {
        if (cleanCuit.length >= 7 && cleanCuit.length <= 8) {
            docTipo = 96 // DNI
        } else {
            docTipo = 99 // Consumidor Final
            // If it's a dummy CUIT like 00000000000 or 1, maybe send 0? 
            // AFIP allows DocNro 0 for DocTipo 99 (Simpler sales).
            if (cleanCuit.length === 11 && cleanCuit.startsWith('00')) {
                docNro = '0'
            }
        }
    } else {
        if (cleanCuit.length !== 11) {
            // Fallback for invalid CUITs on strict types
            docTipo = 99
        }
    }

    const afipData: any = {
        cbteTipo,
        ptoVta,
        cbteNro: 0,
        cbteFch: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        impTotal,
        impTotConc: 0,
        impNeto,
        impOpEx: 0,
        impTrib: 0,
        impIVA,
        monId: 'PES',
        monCotiz: 1,
        docTipo,
        docNro,

        // RG 5616: Campo Condicion Frente al IVA
        condicionIvaReceptorId: conditionCode, // Using XML Tag now

        ivas: Array.from(ivasMap.entries()).map(([id, val]) => ({ id, ...val })),

        concept: Number(concepto),
        fchServDesde: concepto !== 1 && serviceFrom ? serviceFrom.replace(/-/g, '') : undefined,
        fchServHasta: concepto !== 1 && serviceTo ? serviceTo.replace(/-/g, '') : undefined,
        fchVtoPago: concepto !== 1 && paymentDue ? paymentDue.replace(/-/g, '') : undefined,
    }

    try {
        // 4. Get Last Voucher
        const lastCbte = await getLastVoucher(session.userId, ptoVta, cbteTipo)
        afipData.cbteNro = lastCbte + 1

        // 5. Authorize
        console.log("Authorizing Invoice with AFIP...", afipData)
        const caeData = await authorizeInvoice(session.userId, afipData)

        // Generate QR Data
        const qrPayload = {
            ver: 1,
            fecha: afipData.cbteFch.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3'),
            cuit: Number(client.cuit), // Wait, this should be EMISOR CUIT? 
            // Wait, "cuit" in QR is EMISOR. "nroDocRec" is RECEPTOR.
            // We need USER CUIT.
            // Let's fetch User to be sure or pass it.
            // I'll fetch it below or assume fetching.
            ptoVta: afipData.ptoVta,
            tipoCmp: afipData.cbteTipo,
            nroCmp: afipData.cbteNro,
            importe: afipData.impTotal,
            moneda: afipData.monId,
            ctz: afipData.monCotiz,
            tipoDocRec: afipData.docTipo,
            nroDocRec: Number(afipData.docNro),
            tipoCodAut: 'E',
            codAut: Number(caeData.cae)
        }

        // We need the issuer CUIT for the QR.
        // We don't have it easily in `afipData` struct constructed here (it used `client` for docNro).
        // `user.cuit` was fetched inside verifySession or should be fetched.
        // `verifySession` returns userId. `getLastVoucher` fetches user. `authorizeInvoice` fetches user.
        // We should fetch user here to be clean or update `verifySession` to return it? 
        // Let's fetch it quickly or move `authorizeInvoice` logic into a service that returns context.
        const user = await db.user.findUnique({ where: { id: session.userId } })
        if (!user) throw new Error("Usuario no encontrado para QR")

        // Correct CUIT Emisor
        const qrPayloadFinal = { ...qrPayload, cuit: Number(user.cuit) }

        const { generateAfipQrUrl } = await import('@/lib/afip/afip-qr')
        const qrUrl = generateAfipQrUrl(qrPayloadFinal)

        // 6. Save to DB
        const invoice = await db.invoice.create({
            data: {
                userId: session.userId,
                clientId,
                type,
                pointOfSale: ptoVta,
                number: afipData.cbteNro,
                date: new Date(),
                cae: caeData.cae,
                caeExpiresAt: new Date(caeData.caeFchVto.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')),
                netAmount: impNeto,
                ivaAmount: impIVA,
                totalAmount: impTotal,
                status: 'APPROVED',
                qrCodeData: qrUrl,
                items: {
                    create: items.map((item: any) => ({
                        description: item.description || "Item",
                        quantity: item.quantity,
                        unitPrice: item.price,
                        subtotal: item.quantity * item.price,
                        ivaRate: item.ivaRate
                    })),
                },
                paymentCondition,
                concept: Number(concepto),
                serviceFrom: serviceFrom ? new Date(serviceFrom) : null,
                serviceTo: serviceTo ? new Date(serviceTo) : null,
                paymentDue: paymentDue ? new Date(paymentDue) : null,
            }
        })

        revalidatePath('/dashboard/billing')
        return { success: true, invoiceId: invoice.id }

    } catch (error: any) {
        console.error("Billing Action Error:", error)

        // Save failed attempt if it was an AFIP error?
        // For now, just return error to UI.
        return { message: error.message || 'Error al emitir factura' }
    }
}

export async function saveInvoice(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const data = Object.fromEntries(formData)
    const result = InvoiceSchema.safeParse(data)

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors }
    }

    const { clientId, type, items: itemsJson, concepto = 1, serviceFrom, serviceTo, paymentDue, paymentCondition = 'Transferencia', isQuote } = result.data
    const items = JSON.parse(itemsJson)

    // 1. Get Config (Just for Sale Point default or validation)
    const config = await db.userConfig.findUnique({ where: { userId: session.userId } })
    if (!config) return { message: 'Falta configuración de usuario' }
    const ptoVta = config.salePoint

    const isBudget = isQuote === 'true' || isQuote === 'on'
    const status = isBudget ? 'QUOTE' : 'DRAFT'

    // 2. Client Data
    const client = await db.client.findUnique({ where: { id: clientId } })
    if (!client) return { message: 'Cliente no encontrado' }

    // 3. Calculate Totals
    let impNeto = 0
    let impIVA = 0
    let impTotal = 0

    for (const item of items) {
        const quantity = Number(item.quantity)
        const price = Number(item.price)
        const subtotal = quantity * price
        const ivaRate = Number(item.ivaRate)

        // Same logic as createInvoice for Totals
        if (type === 'C') {
            impNeto += subtotal
        } else {
            impNeto += subtotal
            impIVA += subtotal * (ivaRate / 100)
        }
    }
    impTotal = impNeto + impIVA

    // 3.1 Quote Number Logic
    let quoteNumber = null
    if (status === 'QUOTE') {
        const lastQuote = await db.invoice.findFirst({
            where: { userId: session.userId, status: 'QUOTE', quoteNumber: { not: null } },
            orderBy: { quoteNumber: 'desc' }
        })
        quoteNumber = (lastQuote?.quoteNumber || 0) + 1
    }

    try {
        const invoice = await db.invoice.create({
            data: {
                userId: session.userId,
                clientId,
                type,
                pointOfSale: ptoVta,
                number: 0,
                quoteNumber, // Assign calculated number
                date: new Date(),
                status,
                netAmount: impNeto,
                ivaAmount: impIVA,
                totalAmount: impTotal,
                paymentCondition,
                concept: Number(concepto),
                serviceFrom: serviceFrom ? new Date(serviceFrom) : null,
                serviceTo: serviceTo ? new Date(serviceTo) : null,
                paymentDue: paymentDue ? new Date(paymentDue) : null,
                items: {
                    create: items.map((item: any) => ({
                        description: item.description || "Item",
                        quantity: item.quantity,
                        unitPrice: item.price,
                        subtotal: item.quantity * item.price,
                        ivaRate: item.ivaRate,
                        productId: (item.productId === 'custom' || !item.productId) ? null : item.productId
                    })),
                },
            }
        })
        revalidatePath('/dashboard/billing')
        return { success: true, invoiceId: invoice.id }
    } catch (e: any) {
        return { message: 'Error al guardar: ' + e.message }
    }
}


export async function emitInvoice(invoiceId: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        // 1. Fetch Draft
        const invoice = await db.invoice.findUnique({
            where: { id: invoiceId, userId: session.userId },
            include: { client: true, items: true, relatedInvoice: true }
        })

        if (!invoice) return { message: 'Factura no encontrada' }
        if (invoice.status !== 'DRAFT' && invoice.status !== 'QUOTE') return { message: 'La factura ya fue emitida o aprobada' }

        const client = invoice.client

        // 2. Prepare Data for AFIP (Reuse logic from createInvoice ideally, but we will adapt here)
        const config = await db.userConfig.findUnique({ where: { userId: session.userId } })
        if (!config) return { message: 'Falta configuración de punto de venta.' }

        const ptoVta = config.salePoint
        const cbteTipo = AFIP_INVOICE_TYPES[invoice.type] || 11

        // Recalculate or use stored? Use stored but verify logic.
        // Actually, for Drafts, trust DB values? Yes.

        // Map IVAs again for AFIP array
        const ivasMap = new Map<number, { baseImp: number, importe: number }>()

        // If Type C, empty IVAs.
        if (invoice.type !== 'C') {
            // Reconstruct IVAs from items
            for (const item of invoice.items) {
                const netItem = Number(item.subtotal) // Assuming stored is Net
                const rate = Number(item.ivaRate)
                const ivaItem = netItem * (rate / 100)

                const afipIvaId = IVA_RATES[String(rate)] || 3
                if (afipIvaId !== 3) {
                    const current = ivasMap.get(afipIvaId) || { baseImp: 0, importe: 0 }
                    current.baseImp += netItem
                    current.importe += ivaItem
                    ivasMap.set(afipIvaId, current)
                }
            }
        }

        let conditionCode = 5
        const cond = (client.ivaCondition || '').toLowerCase()
        if (cond.includes('inscripto')) conditionCode = 1
        else if (cond.includes('monotributo')) conditionCode = 6
        else if (cond.includes('exento')) conditionCode = 4
        else if (cond.includes('consumidor')) conditionCode = 5

        // Determine DocTipo and DocNro automatically based on CUIT/DNI content
        // This ensures that if we have a valid ID, we send it (avoiding AFIP Limit errors for Anonymous)
        // And if we don't, we correctly send Anonymous (99 / 0).
        const cleanCuit = client.cuit.trim().replace(/\D/g, '')
        let docNro = cleanCuit
        let docTipo = 80 // Default CUIT

        if (cleanCuit.length === 11) {
            docTipo = 80 // CUIT
        } else if (cleanCuit.length >= 7 && cleanCuit.length <= 8) {
            docTipo = 96 // DNI
        } else {
            // Fallback for empty, invalid, or generic consumer
            docTipo = 99
            docNro = '0'
        }

        const afipData: any = {
            cbteTipo,
            ptoVta,
            cbteNro: 0, // Will be assigned
            cbteFch: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
            impTotal: Number(invoice.totalAmount),
            impTotConc: 0,
            impNeto: Number(invoice.netAmount),
            impOpEx: 0,
            impTrib: 0,
            impIVA: Number(invoice.ivaAmount),
            monId: 'PES',
            monCotiz: 1,
            docTipo,
            docNro,
            condicionIvaReceptorId: conditionCode,
            ivas: Array.from(ivasMap.entries()).map(([id, val]) => ({ id, ...val })),
            concept: invoice.concept,
            fchServDesde: invoice.concept !== 1 && invoice.serviceFrom ? invoice.serviceFrom.toISOString().slice(0, 10).replace(/-/g, '') : undefined,
            fchServHasta: invoice.concept !== 1 && invoice.serviceTo ? invoice.serviceTo.toISOString().slice(0, 10).replace(/-/g, '') : undefined,
            fchVtoPago: invoice.concept !== 1 && invoice.paymentDue ? invoice.paymentDue.toISOString().slice(0, 10).replace(/-/g, '') : undefined,
            cbtesAsoc: (invoice.relatedInvoice) ? [{
                Tipo: AFIP_INVOICE_TYPES[invoice.relatedInvoice.type] || 11,
                PtoVta: invoice.relatedInvoice.pointOfSale,
                Nro: invoice.relatedInvoice.number
            }] : undefined
        }

        // VALIDATION: Service Dates
        if (invoice.concept !== 1) {
            if (!afipData.fchServDesde || !afipData.fchServHasta || !afipData.fchVtoPago) {
                // Return clear error instead of crashing at AFIP
                return { message: "Error: Para conceptos de Servicios/Productos y Servicios, debe indicar las fechas del servicio y vencimiento de pago." }
            }
        }

        // Fix 10049: Service Dates for NC
        if (afipData.concept !== 1) {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
            if (!afipData.fchServDesde) afipData.fchServDesde = today
            if (!afipData.fchServHasta) afipData.fchServHasta = today
            if (!afipData.fchVtoPago) afipData.fchVtoPago = today
        }

        console.log("[EMIT] Constructed AFIP Data:", JSON.stringify(afipData, null, 2))

        // STRICT VALIDATION for Credit Notes
        const isNC = [3, 8, 13].includes(cbteTipo)
        if (isNC && !afipData.cbtesAsoc) {
            console.error("[EMIT] Error: Credit Note missing Associated Voucher structure.")
            // Try to salvage if we have the ID but verify logic failed? 
            // If relatedInvoice was null, we can't do much.
            return { message: "Error: La Nota de Crédito no tiene un comprobante asociado válido." }
        }

        // 3. Get Last Voucher
        const lastCbte = await getLastVoucher(session.userId, ptoVta, cbteTipo)
        afipData.cbteNro = lastCbte + 1

        // 4. Authorize
        console.log("Authorizing Draft Invoice...", afipData)
        const caeData = await authorizeInvoice(session.userId, afipData)

        // 5. Generate QR
        const user = await db.user.findUnique({ where: { id: session.userId } })

        const qrPayload = {
            ver: 1,
            fecha: afipData.cbteFch.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3'),
            cuit: Number(user?.cuit),
            ptoVta: afipData.ptoVta,
            tipoCmp: afipData.cbteTipo,
            nroCmp: afipData.cbteNro,
            importe: afipData.impTotal,
            moneda: afipData.monId,
            ctz: afipData.monCotiz,
            tipoDocRec: afipData.docTipo,
            nroDocRec: Number(afipData.docNro),
            tipoCodAut: 'E',
            codAut: Number(caeData.cae)
        }

        const { generateAfipQrUrl } = await import('@/lib/afip/afip-qr')
        const qrUrl = generateAfipQrUrl(qrPayload)

        // 6. Update Invoice in DB
        await db.invoice.update({
            where: { id: invoiceId },
            data: {
                number: afipData.cbteNro,
                date: new Date(), // Update date to emission date
                cae: caeData.cae,
                caeExpiresAt: new Date(caeData.caeFchVto.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')),
                status: 'APPROVED',
                qrCodeData: qrUrl
            }
        })

        revalidatePath('/dashboard/billing')
        return { success: true }

    } catch (error: any) {
        console.error("Emit Action Error:", error)
        return { message: error.message || 'Error al emitir' }
    }
}


export async function getInvoices(filters?: {
    status?: string
    isCreditNote?: boolean
    isBudget?: boolean
}) {
    const session = await verifySession()
    if (!session) return []

    const where: any = { userId: session.userId }

    if (filters?.isBudget) {
        where.status = 'QUOTE'
    } else if (filters?.status) {
        where.status = filters.status
    }

    if (filters?.isCreditNote !== undefined) {
        if (filters.isCreditNote) {
            where.type = { in: ['NCA', 'NCB', 'NCC'] }
        } else {
            // Exclude NCs and ensure we don't accidentally exclude other things if we just want "Invoices"
            // But if we want Invoices, we usually mean Type A, B, C...
            // To be safe, let's say "Not in NC types"
            where.type = { notIn: ['NCA', 'NCB', 'NCC'] }
        }
    }

    return db.invoice.findMany({
        where,
        include: { client: true, items: true, user: { select: { cuit: true } }, relatedInvoice: true },
        orderBy: { date: 'desc' }
    })
}

export async function deleteInvoice(id: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        console.log(`Attempting to delete invoice/quote: ${id}`)
        const invoice = await db.invoice.findUnique({
            where: { id, userId: session.userId }
        })

        if (!invoice) {
            console.log(`Invoice ${id} not found or not owned by user ${session.userId}`)
            return { message: 'Factura no encontrada' }
        }

        console.log(`Found invoice: ${invoice.id}, Status: ${invoice.status}`)

        if (invoice.status !== 'DRAFT' && invoice.status !== 'QUOTE' && invoice.status !== 'PROVISIONAL') {
            console.log(`Cannot delete invoice with status: ${invoice.status}`)
            return { message: 'Solo se pueden eliminar borradores, provisionales o presupuestos' }
        }

        await db.invoice.delete({
            where: { id }
        })

        console.log(`Successfully deleted invoice ${id}`)
        revalidatePath('/dashboard/billing')
        revalidatePath('/dashboard/billing/budgets')
        revalidatePath('/dashboard/billing/invoices')
        return { success: true }
    } catch (error: any) {
        console.error(`Error deleting invoice ${id}:`, error)
        return { message: 'Error al eliminar factura: ' + error.message }
    }
}


export async function updateInvoice(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    const data = Object.fromEntries(formData)
    const invoiceId = data.id as string
    const itemsJson = data.items as string
    const paymentCondition = data.paymentCondition as string
    const serviceFrom = data.serviceFrom as string
    const serviceTo = data.serviceTo as string
    const paymentDue = data.paymentDue as string

    if (!invoiceId) return { message: 'ID de factura faltante' }
    if (!itemsJson) return { message: 'Items faltantes' }

    try {
        const items = JSON.parse(itemsJson)

        const invoice = await db.invoice.findUnique({
            where: { id: invoiceId, userId: session.userId },
            include: { items: true }
        })

        if (!invoice) return { message: 'Factura no encontrada' }
        if (invoice.status !== 'DRAFT' && invoice.status !== 'QUOTE' && invoice.status !== 'PROVISIONAL') return { message: 'Solo se pueden editar borradores, provisionales o presupuestos' }

        let impNeto = 0
        let impIVA = 0
        let impTotal = 0
        const type = invoice.type

        for (const item of items) {
            const q = Number(item.quantity)
            const p = Number(item.price)
            const rate = Number(item.ivaRate)
            const sub = q * p

            if (type === 'C') {
                impNeto += sub
            } else {
                impNeto += sub
                impIVA += sub * (rate / 100)
            }
        }
        impTotal = impNeto + impIVA

        // Backfill quoteNumber if missing for Quotes
        let quoteNumberUpgrade = undefined
        if (invoice.status === 'QUOTE' && !invoice.quoteNumber) {
            const lastQuote = await db.invoice.findFirst({
                where: { userId: session.userId, status: 'QUOTE', quoteNumber: { not: null } },
                orderBy: { quoteNumber: 'desc' }
            })
            quoteNumberUpgrade = (lastQuote?.quoteNumber || 0) + 1
        }

        await db.$transaction([
            db.invoiceItem.deleteMany({ where: { invoiceId } }),
            db.invoice.update({
                where: { id: invoiceId },
                data: {
                    netAmount: impNeto,
                    ivaAmount: impIVA,
                    totalAmount: impTotal,
                    paymentCondition,
                    serviceFrom: serviceFrom ? new Date(serviceFrom) : null,
                    serviceTo: serviceTo ? new Date(serviceTo) : null,
                    paymentDue: paymentDue ? new Date(paymentDue) : null,
                    quoteNumber: quoteNumberUpgrade, // Will only update if defined
                    items: {
                        create: items.map((item: any) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.price,
                            subtotal: item.quantity * item.price,
                            ivaRate: item.ivaRate,
                            productId: (item.productId === 'custom' || !item.productId) ? null : item.productId
                        }))
                    }
                }
            })
        ])

        revalidatePath('/dashboard/billing')
        return { success: true }

    } catch (e: any) {
        console.error(e)
        return { message: 'Error al actualizar factura: ' + e.message }
    }
}

export async function createCreditNote(invoiceId: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        console.log("Creating NC for invoice:", invoiceId)
        const original = await db.invoice.findUnique({
            where: { id: invoiceId, userId: session.userId },
            include: { items: true }
        })
        if (!original) {
            console.error("Original invoice not found", invoiceId)
            return { message: 'Factura original no encontrada' }
        }

        const ncType = original.type === 'A' ? 'NCA' :
            original.type === 'B' ? 'NCB' :
                original.type === 'C' ? 'NCC' : original.type

        const nc = await db.invoice.create({
            data: {
                userId: session.userId,
                clientId: original.clientId,
                type: ncType,
                pointOfSale: original.pointOfSale,
                number: 0,
                date: new Date(),
                status: 'DRAFT',
                netAmount: original.netAmount,
                ivaAmount: original.ivaAmount,
                totalAmount: original.totalAmount,
                concept: original.concept,
                relatedInvoiceId: original.id,
                serviceFrom: original.serviceFrom,
                serviceTo: original.serviceTo,
                paymentDue: original.paymentDue,
                items: {
                    create: original.items.map(i => ({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        subtotal: i.subtotal,
                        ivaRate: i.ivaRate,
                        productId: i.productId
                    }))
                }
            }
        })

        revalidatePath('/dashboard/billing')
        return { success: true, invoiceId: nc.id }

    } catch (e: any) {
        return { message: 'Error al crear Nota de Crédito: ' + e.message }
    }
}

export async function deleteInvoices(ids: string[]) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const id of ids) {
        // Reuse single delete logic to keep consistency
        const res = await deleteInvoice(id)
        if (res.success) {
            successCount++
        } else {
            failCount++
            errors.push(`ID ${id}: ${res.message}`)
        }
    }

    if (failCount === 0) {
        return { success: true, message: `Se eliminaron ${successCount} borradores.` }
    } else {
        return {
            success: successCount > 0, // Partial success is still success-ish
            message: `Eliminados: ${successCount}. Fallidos: ${failCount}`,
            errors
        }
    }
}

export async function emitInvoices(ids: string[]) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    // Must be sequential to avoid AFIP sequence collisions (CbteNro)
    for (const id of ids) {
        try {
            const res = await emitInvoice(id)
            if (res.success) {
                successCount++
            } else {
                failCount++
                errors.push(`ID ${id}: ${res.message}`)
            }
        } catch (e: any) {
            failCount++
            errors.push(`ID ${id}: ${e.message}`)
        }
    }

    if (failCount === 0) {
        revalidatePath('/dashboard/billing')
        return { success: true, message: `Se emitieron ${successCount} facturas.` }
    } else {
        revalidatePath('/dashboard/billing')
        return {
            success: successCount > 0,
            message: `Emitidos: ${successCount}. Fallidos: ${failCount}`,
            errors
        }
    }
}

export async function handleInvoiceAction(prevState: any, formData: FormData) {
    const action = formData.get('_action')
    if (action === 'save_quote') {
        formData.set('isQuote', 'true')
        return saveInvoice(prevState, formData)
    }
    if (action === 'save_draft') {
        formData.set('isDraft', 'true')
    }
    return createInvoice(prevState, formData)
}

export async function markAsProvisional(invoiceId: string) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        const result = await db.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId, userId: session.userId }
            })

            if (!invoice) throw new Error('Factura no encontrada')
            // Allow moving from DRAFT to PROVISIONAL. 
            // Also allow PROVISIONAL to stay PROVISIONAL (re-print)? Or re-number? 
            // Let's assume once PROVISIONAL it keeps the number.
            if (invoice.status === 'PROVISIONAL') return invoice

            if (invoice.status !== 'DRAFT') throw new Error('Solo se pueden marcar como provisionales los borradores')

            const config = await tx.userConfig.findUnique({
                where: { userId: session.userId }
            })

            const nextDraftNumber = (config?.lastDraftNumber || 0) + 1

            const updated = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: 'PROVISIONAL',
                    draftNumber: nextDraftNumber
                }
            })

            await tx.userConfig.update({
                where: { userId: session.userId },
                data: { lastDraftNumber: nextDraftNumber }
            })

            return updated
        })

        revalidatePath('/dashboard/billing')
        return { success: true, draftNumber: result.draftNumber }

    } catch (e: any) {
        return { message: e.message }
    }
}
