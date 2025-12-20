import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/session'
import { db } from '@/lib/db'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/billing/invoice-pdf'
import { Document, Page } from '@react-pdf/renderer'
import React from 'react'
import { generateAfipQrUrl } from '@/lib/afip/afip-qr'

export const dynamic = 'force-dynamic'

// We need a wrapper to combine multiple invoices into one Document with multiple Pages
const BulkInvoicePDF = ({ invoices }: { invoices: any[] }) => {
    // We already have <InvoicePDF> which renders a <Document><Page/></Document>
    // But we cannot nest <Document> inside <Document>. 
    // We need to extract the render logic of InvoicePDF or refactor it.
    // However, <InvoicePDF> returns a <Document>.
    // Hack: We can just map over invoices and for each one render the internal <Page> component.
    // BUT InvoicePDF is a component that returns <Document>. We can't easily rip out the Page unless we export valid Page component.

    // Better approach: Let's create a specialized PDF structure here reusing the styles/layout if possible?
    // Or simpler: The user wants "Print Selected". If we concatenate PDFs on server it's hard with react-pdf.
    // Actually react-pdf can render multiple pages.

    // Let's reuse InvoicePDF logic but we need to modify InvoicePDF to accept a "PageOnly" prop or similar?
    // Or just copy the render logic. Copying is safer to avoid breaking single print.
    return (
        <Document>
            {invoices.map((data, index) => (
                <InvoicePage key={index} {...data} />
            ))}
        </Document>
    )
}

// We need to duplicate the styles and layout from InvoicePDF to here to make it work as a Page component.
// Imports are tricky. Let's start by modifying InvoicePDF to default export the Page component separately?
// No, let's just copy the styles for now to ensure speed and stability without refactoring the single download.

import { StyleSheet, View, Text, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#000'
    },
    header: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 10
    },
    headerLeft: { width: '40%', paddingRight: 10 },
    headerCenter: { width: '10%', alignItems: 'center', marginTop: 10 },
    headerRight: { width: '50%', paddingLeft: 20 },
    logo: { width: 180, height: 70, objectFit: 'contain', marginBottom: 10 },
    companyName: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    companyInfo: { fontSize: 9, lineHeight: 1.3 },
    letterContainer: { alignItems: 'center' },
    letter: { fontSize: 36, fontWeight: 'bold' },
    letterCode: { fontSize: 8, marginTop: 2 },
    letterLabel: { fontSize: 7, marginTop: 2 },
    invoiceTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 10, textTransform: 'uppercase' },
    detailRow: { flexDirection: 'row', marginBottom: 4, justifyContent: 'flex-end' },
    detailLabel: { width: 80, fontWeight: 'bold', textAlign: 'left' },
    detailValue: { width: 100, textAlign: 'right' },
    clientSection: { marginTop: 10, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10 },
    clientRow: { flexDirection: 'row', marginBottom: 6 },
    clientLabel: { fontWeight: 'bold', width: 60 },
    clientValue: { flex: 1 },
    infoStrip: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 5, marginBottom: 15 },
    table: { width: '100%', marginBottom: 50 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#e0f2fe', borderTopWidth: 1, borderTopColor: '#a1a1aa', borderBottomWidth: 1, borderBottomColor: '#a1a1aa', paddingVertical: 5, paddingHorizontal: 4 },
    tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
    colDesc: { width: '50%', fontSize: 9 },
    colQty: { width: '10%', textAlign: 'center', fontSize: 9 },
    colPrice: { width: '20%', textAlign: 'right', fontSize: 9 },
    colTotal: { width: '20%', textAlign: 'right', fontSize: 9 },
    footerSection: { marginTop: 'auto', borderTopWidth: 2, borderTopColor: '#000', paddingTop: 5 },
    totalsContainer: { flexDirection: 'row', backgroundColor: '#e0f2fe', padding: 5, alignItems: 'center' },
    totalLabel: { fontSize: 10, fontWeight: 'bold' },
    totalValue: { fontSize: 10, fontWeight: 'bold' },
    caeContainer: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    qrCode: { width: 80, height: 80 }
});

const InvoicePage = ({ invoice, user, client, items }: any) => {
    const formatDate = (date: any) => new Date(date).toLocaleDateString('es-AR');
    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: invoice.currency || 'ARS' }).format(amount);

    const config = user.config || {}
    const realName = config.businessName || user.name || 'EMISOR'
    const address = config.businessAddress || user.address || 'Dirección no especificada'
    const phone = config.businessPhone || ''
    const email = user.email || ''

    // QR Generation on fly or passed?
    // We need to generate QR.
    let qrImage = null
    if (invoice.qrCodeData) {
        // Just use existing URL from DB? Yes.
        // Wait, react-pdf Image accepts URL.
    }

    return (
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {config.logoUrl && <Image src={config.logoUrl} style={styles.logo} />}
                    <Text style={styles.companyInfo}>{realName}</Text>
                    <Text style={styles.companyInfo}>{address}</Text>
                    <Text style={styles.companyInfo}>{phone}</Text>
                    <Text style={styles.companyInfo}>{email}</Text>
                </View>
                <View style={styles.headerCenter}>
                    <View style={styles.letterContainer}>
                        <Text style={styles.letter}>{invoice.status === 'QUOTE' ? 'X' : invoice.type}</Text>
                        <Text style={styles.letterCode}>
                            {invoice.status === 'QUOTE' ? 'PRE' : (invoice.type === 'A' ? 'COD. 001' : invoice.type === 'B' ? 'COD. 006' : 'COD. 011')}
                        </Text>
                        <Text style={styles.letterLabel}>{config.ivaCondition}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <Text style={styles.invoiceTitle}>
                        {invoice.type && invoice.type.startsWith('NC') ? 'NOTA DE CRÉDITO' :
                            invoice.status === 'QUOTE' ? 'PRESUPUESTO' : 'FACTURA'}
                    </Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                            {invoice.status === 'QUOTE' ? 'Cotización N°:' : 'N° Comp.:'}
                        </Text>
                        <Text style={styles.detailValue}>
                            {invoice.status === 'QUOTE' && invoice.quoteNumber
                                ? `N° ${String(invoice.quoteNumber).padStart(8, '0')}`
                                : `${String(invoice.pointOfSale).padStart(4, '0')}-${String(invoice.number).padStart(8, '0')}`}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fecha:</Text>
                        <Text style={styles.detailValue}>{formatDate(invoice.date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>CUIT:</Text>
                        <Text style={styles.detailValue}>{user.cuit}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.clientSection}>
                <View style={styles.clientRow}>
                    <Text style={styles.clientLabel}>Señor(es):</Text>
                    <Text style={[styles.clientValue, { fontWeight: 'bold' }]}>{client.name}</Text>
                    <Text style={styles.clientLabel}>CUIT:</Text>
                    <Text style={styles.clientValue}>{client.cuit}</Text>
                </View>
                <View style={styles.clientRow}>
                    <Text style={styles.clientLabel}>Domicilio:</Text>
                    <Text style={styles.clientValue}>{client.address || '-'}</Text>
                    <Text style={styles.clientLabel}>Cond. IVA:</Text>
                    <Text style={styles.clientValue}>{client.ivaCondition}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colDesc}>Descripción</Text>
                    <Text style={styles.colQty}>Cant.</Text>
                    <Text style={styles.colPrice}>Precio Unit.</Text>
                    <Text style={styles.colTotal}>Importe</Text>
                </View>
                {items.map((item: any, i: number) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={styles.colDesc}>{item.description}</Text>
                        <Text style={styles.colQty}>{Number(item.quantity).toString()}</Text>
                        <Text style={styles.colPrice}>{formatCurrency(Number(item.unitPrice))}</Text>
                        <Text style={styles.colTotal}>{formatCurrency(Number(item.subtotal))}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.footerSection}>
                <View style={styles.totalsContainer}>
                    <View style={{ flex: 1 }}></View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.totalLabel, { marginRight: 10 }]}>TOTAL:</Text>
                        <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrency(Number(invoice.totalAmount))}</Text>
                    </View>
                </View>
                <View style={styles.caeContainer}>
                    <View>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>CAE N°: {invoice.cae}</Text>
                        <Text style={{ fontSize: 9 }}>Vto.: {invoice.caeExpiresAt ? formatDate(invoice.caeExpiresAt) : ''}</Text>
                    </View>
                    {invoice.qrCodeData && <Image src={invoice.qrCodeData} style={styles.qrCode} />}
                </View>
            </View>
        </Page>
    )
}


export async function POST(req: Request) {
    const session = await verifySession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const { invoiceIds } = await req.json()
        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return NextResponse.json({ message: 'No invoice IDs provided' }, { status: 400 })
        }

        const invoices = await db.invoice.findMany({
            where: {
                id: { in: invoiceIds },
                userId: session.userId
            },
            include: {
                client: true,
                items: true,
                user: { include: { config: true } },
                relatedInvoice: true
            },
            orderBy: { date: 'desc' }
        })

        if (!invoices.length) {
            return NextResponse.json({ message: 'No invoices found' }, { status: 404 })
        }

        // Render PDF
        // Pass necessary data to component
        const invoiceDataList = invoices.map(inv => ({
            invoice: inv,
            user: inv.user,
            client: inv.client,
            items: inv.items
        }))

        const pdfStream = await renderToBuffer(
            <BulkInvoicePDF invoices={invoiceDataList} />
        )

        return new NextResponse(pdfStream as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="facturas-seleccionadas.pdf"'
            }
        })

    } catch (error: any) {
        console.error('Bulk PDF Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
