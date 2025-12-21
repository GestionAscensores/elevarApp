'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { getLastVoucher, getInvoiceDetails } from '@/lib/afip/wsfe'
import { revalidatePath } from 'next/cache'

const INVOICE_TYPES_MAP: Record<number, string> = {
    1: 'A',
    6: 'B',
    11: 'C',
    3: 'NCA',
    8: 'NCB',
    13: 'NCC'
}

export async function syncHistoricalData(invoiceType: number = 11) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    try {
        // Get user config for point of sale
        const config = await db.userConfig.findUnique({ where: { userId: session.userId } })
        if (!config) return { message: 'Falta configuración de usuario' }

        const ptoVta = config.salePoint

        // Get last voucher from ARCA
        const lastVoucherNumber = await getLastVoucher(session.userId, ptoVta, invoiceType)

        console.log('[SYNC] Last voucher in ARCA:', lastVoucherNumber)

        if (lastVoucherNumber === 0) {
            return { success: true, count: 0, message: 'No hay comprobantes en ARCA para sincronizar' }
        }

        // Optimización: Estrategia "Hacia Atrás" (Backwards)
        // en lugar de buscar el ultimo local + 1, buscamos huecos desde el final hacia el principio.
        // Esto prioriza los últimos meses para el cálculo de Monotributo.

        // 1. Get all local invoice numbers for this POS and Type to find gaps
        const localInvoices = await db.invoice.findMany({
            where: {
                userId: session.userId,
                pointOfSale: ptoVta,
                type: INVOICE_TYPES_MAP[invoiceType],
            },
            select: { number: true }
        })

        const existingSet = new Set(localInvoices.map(inv => inv.number))
        const missingNumbers: number[] = []
        const BATCH_SIZE = 50 // Reduce risk of timeout

        // 2. Identify missing numbers from LastVoucher down to 1
        for (let i = lastVoucherNumber; i >= 1; i--) {
            if (!existingSet.has(i)) {
                missingNumbers.push(i)
            }
            if (missingNumbers.length >= BATCH_SIZE) break
        }

        if (missingNumbers.length === 0) {
            return {
                success: true,
                count: 0,
                message: `Todos los comprobantes están sincronizados (Total: ${lastVoucherNumber})`
            }
        }

        console.log(`[SYNC] Found ${missingNumbers.length} missing invoices. Fetching...`, missingNumbers)

        let imported = 0
        let errors = 0
        let lastError = ''

        // 3. Iterate missing numbers
        for (const cbteNro of missingNumbers) {
            try {
                console.log(`[SYNC] Fetching invoice ${cbteNro}...`)
                const invoiceData = await getInvoiceDetails(session.userId, ptoVta, invoiceType, cbteNro)

                // Find or create client based on CUIT
                let client = await db.client.findFirst({
                    where: {
                        userId: session.userId,
                        cuit: invoiceData.docNro
                    }
                })

                if (!client) {
                    // Create placeholder client
                    client = await db.client.create({
                        data: {
                            userId: session.userId,
                            name: `Cliente CUIT ${invoiceData.docNro}`,
                            cuit: invoiceData.docNro,
                            docType: String(invoiceData.docTipo),
                            ivaCondition: 'Consumidor Final', // Default
                            address: ''
                        }
                    })
                }

                // Parse date from YYYYMMDD
                const year = invoiceData.cbteFch.substring(0, 4)
                const month = invoiceData.cbteFch.substring(4, 6)
                const day = invoiceData.cbteFch.substring(6, 8)
                const invoiceDate = new Date(`${year}-${month}-${day}`)

                // Parse CAE expiration
                const caeYear = invoiceData.caeFchVto.substring(0, 4)
                const caeMonth = invoiceData.caeFchVto.substring(4, 6)
                const caeDay = invoiceData.caeFchVto.substring(6, 8)
                const caeExpiry = new Date(`${caeYear}-${caeMonth}-${caeDay}`)

                // Parse service dates if available
                let serviceFrom = null
                let serviceTo = null
                if (invoiceData.fchServDesde) {
                    const sfYear = invoiceData.fchServDesde.substring(0, 4)
                    const sfMonth = invoiceData.fchServDesde.substring(4, 6)
                    const sfDay = invoiceData.fchServDesde.substring(6, 8)
                    serviceFrom = new Date(`${sfYear}-${sfMonth}-${sfDay}`)
                }
                if (invoiceData.fchServHasta) {
                    const stYear = invoiceData.fchServHasta.substring(0, 4)
                    const stMonth = invoiceData.fchServHasta.substring(4, 6)
                    const stDay = invoiceData.fchServHasta.substring(6, 8)
                    serviceTo = new Date(`${stYear}-${stMonth}-${stDay}`)
                }

                // Create invoice in DB
                await db.invoice.create({
                    data: {
                        userId: session.userId,
                        clientId: client.id,
                        type: INVOICE_TYPES_MAP[invoiceType],
                        pointOfSale: ptoVta,
                        number: cbteNro,
                        date: invoiceDate,
                        cae: invoiceData.cae,
                        caeExpiresAt: caeExpiry,
                        netAmount: invoiceData.impNeto,
                        ivaAmount: invoiceData.impIVA,
                        totalAmount: invoiceData.impTotal,
                        status: 'APPROVED',
                        concept: invoiceData.concepto,
                        serviceFrom,
                        serviceTo,
                        items: {
                            create: [{
                                description: 'Comprobante sincronizado desde ARCA',
                                quantity: 1,
                                unitPrice: invoiceData.impNeto,
                                subtotal: invoiceData.impNeto,
                                ivaRate: invoiceData.impNeto > 0 ? (invoiceData.impIVA / invoiceData.impNeto) * 100 : 0
                            }]
                        }
                    }
                })

                imported++
                await new Promise(resolve => setTimeout(resolve, 100)) // Slight delay

            } catch (err: any) {
                console.error(`[SYNC] Error syncing invoice ${cbteNro}:`, err.message)
                errors++
                lastError = err.message
            }
        }

        let resultMsg = `Se importaron ${imported} comprobantes recientes.`
        if (errors > 0) resultMsg += ` ${errors} fallaron. (Ultimo error: ${lastError})`

        if (imported > 0) {
            revalidatePath('/dashboard')
            revalidatePath('/dashboard/billing/credit-notes')
        }

        return {
            success: true,
            count: imported,
            message: resultMsg
        }

    } catch (error: any) {
        console.error('Sync error:', error)
        return { message: 'Error al sincronizar: ' + error.message }
    }
}
