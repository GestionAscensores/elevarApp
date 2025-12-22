import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const lastInvoice = await prisma.invoice.findFirst({
        where: { type: { in: ['A', 'B', 'C'] }, status: 'APPROVED' },
        orderBy: { date: 'desc' }
    })

    if (!lastInvoice) {
        console.log('No approved invoices found')
        return
    }

    console.log(`Invoice: ${lastInvoice.type} ${lastInvoice.pointOfSale}-${lastInvoice.number}`)
    console.log(`CAE: ${lastInvoice.cae}`)
    console.log(`QR Data: ${lastInvoice.qrCodeData ? 'PRESENT' : 'MISSING'}`)

    // Fetch User
    const user = await prisma.user.findUnique({ where: { id: lastInvoice.userId } })
    console.log(`User CUIT: ${user?.cuit}`)

    if (user && user.cuit) {
        const payload = {
            ver: 1,
            fecha: lastInvoice.date.toISOString().slice(0, 10),
            cuit: Number(user.cuit),
            ptoVta: lastInvoice.pointOfSale,
            tipoCmp: 11, // Just testing
            nroCmp: lastInvoice.number,
            importe: Number(lastInvoice.totalAmount),
            moneda: 'PES',
            ctz: 1,
            tipoDocRec: 80,
            nroDocRec: 0,
            tipoCodAut: 'E',
            codAut: Number(lastInvoice.cae || 0)
        }
        const jsonString = JSON.stringify(payload)
        const base64Data = Buffer.from(jsonString).toString('base64')
        const url = `https://www.afip.gob.ar/fe/qr/?p=${base64Data}`
        console.log(`Simulated QR content: ${url}`)

        console.log('Backfilling QR data to DB...')
        await prisma.invoice.update({
            where: { id: lastInvoice.id },
            data: { qrCodeData: url }
        })
        console.log('✅ Backfill complete. Please check the PDF for this invoice.')
    }
}

main()
