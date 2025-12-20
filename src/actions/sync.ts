'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { getLastVoucher, getInvoiceDetails } from '@/lib/afip/wsfe'

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

        // Get the highest local voucher number to avoid duplicates
        const lastLocal = await db.invoice.findFirst({
            where: {
                userId: session.userId,
                pointOfSale: ptoVta,
                type: INVOICE_TYPES_MAP[invoiceType],
                status: 'APPROVED'
            },
            orderBy: { number: 'desc' }
        })

        const startFrom = lastLocal ? lastLocal.number + 1 : 1
        const limit = Math.min(lastVoucherNumber, startFrom + 99) // Import up to 100 invoices

        console.log('[SYNC] Range:', { startFrom, limit, lastLocal: lastLocal?.number })

        if (startFrom > lastVoucherNumber) {
            return {
                success: true,
                count: 0,
                message: `Todos los comprobantes ya están sincronizados (último: ${lastVoucherNumber})`
            }
        }

        let imported = 0
        let skipped = 0
        let errors = 0

        // Iterate and fetch each invoice
        for (let cbteNro = startFrom; cbteNro <= limit; cbteNro++) {
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
                    console.log(`[SYNC] Created client for CUIT ${invoiceData.docNro}`)
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

                // Check if invoice already exists
                const existing = await db.invoice.findFirst({
                    where: {
                        userId: session.userId,
                        pointOfSale: ptoVta,
                        type: INVOICE_TYPES_MAP[invoiceType],
                        number: cbteNro
                    }
                })

                if (existing) {
                    skipped++
                    console.log(`[SYNC] Invoice ${cbteNro} already exists, skipping`)
                    continue
                }

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
                console.log(`[SYNC] Successfully imported invoice ${cbteNro}`)

                // Small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 200))
            } catch (err: any) {
                console.error(`[SYNC] Error syncing invoice ${cbteNro}:`, err.message)
                errors++
                // Continue with next invoice
            }
        }

        return {
            success: true,
            count: imported,
            skipped,
            message: `Se importaron ${imported} comprobantes exitosamente. ${skipped > 0 ? `${skipped} ya existían. ` : ''}${errors > 0 ? `${errors} con errores.` : ''}`
        }

    } catch (error: any) {
        console.error('Sync error:', error)
        return { message: 'Error al sincronizar: ' + error.message }
    }
}
