import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#000'
    },
    // Header Layout: 3 Columns
    header: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 10
    },
    headerLeft: {
        width: '40%',
        paddingRight: 10
    },
    headerCenter: {
        width: '10%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 10
    },
    headerRight: {
        width: '50%',
        paddingLeft: 20
    },

    // Logo & Company Info
    logo: {
        width: 180,
        height: 70,
        objectFit: 'contain',
        marginBottom: 10
    },
    companyName: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
        textTransform: 'uppercase'
    },
    companyInfo: {
        fontSize: 9,
        lineHeight: 1.3
    },

    // Letter Box (Center)
    letterContainer: {
        alignItems: 'center'
    },
    letter: {
        fontSize: 36,
        fontWeight: 'bold'
    },
    letterCode: {
        fontSize: 8,
        marginTop: 2
    },
    letterLabel: {
        fontSize: 7,
        marginTop: 2
    },

    // Invoice Details (Right)
    invoiceTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'right',
        marginBottom: 10,
        textTransform: 'uppercase'
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 4,
        justifyContent: 'flex-end'
    },
    detailLabel: {
        width: 80,
        fontWeight: 'bold',
        textAlign: 'left'
    },
    detailValue: {
        width: 100,
        textAlign: 'right'
    },

    // Client Section
    clientSection: {
        marginTop: 10,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 10
    },
    clientRow: {
        flexDirection: 'row',
        marginBottom: 6
    },
    clientLabel: {
        fontWeight: 'bold',
        width: 60
    },
    clientValue: {
        flex: 1
    },

    // Additional Info Strip (Currency, etc)
    infoStrip: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 5,
        marginBottom: 15
    },

    // Table
    table: {
        width: '100%',
        marginBottom: 50
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e0f2fe', // Light blue like reference
        borderTopWidth: 1,
        borderTopColor: '#a1a1aa', // light gray border
        borderBottomWidth: 1,
        borderBottomColor: '#a1a1aa',
        paddingVertical: 5,
        paddingHorizontal: 4,
        alignItems: 'center'
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb'
    },
    // Columns
    colDesc: { width: '50%', fontSize: 9 },
    colQty: { width: '10%', textAlign: 'center', fontSize: 9 },
    colPrice: { width: '20%', textAlign: 'right', fontSize: 9 },
    colTotal: { width: '20%', textAlign: 'right', fontSize: 9 },

    // Footer / Totals
    footerSection: {
        marginTop: 'auto',
        borderTopWidth: 2,
        borderTopColor: '#000',
        paddingTop: 5
    },
    totalsContainer: {
        flexDirection: 'row',
        backgroundColor: '#e0f2fe', // Light blue background
        padding: 5,
        alignItems: 'center'
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 2,
        fontSize: 8
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'bold'
    },

    // CAE
    caeContainer: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    qrCode: {
        width: 80,
        height: 80
    }
});

type InvoicePDFProps = {
    invoice: any;
    user: any;
    client: any;
    items: any[];
    qrImage?: string | null;
};

export const InvoicePDF = ({ invoice, user, client, items, qrImage }: InvoicePDFProps) => {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-AR');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: invoice.currency }).format(amount);
    };

    const config = user.config || {}
    const realName = config.businessName || user.name || 'EMISOR'
    const fantasy = config.fantasyName
    const paymentCondition = invoice.paymentCondition || 'Contado'

    const address = config.businessAddress || user.address || 'Dirección no especificada'
    const phone = config.businessPhone || ''
    const email = user.email || ''

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    {/* Left: Logo & Company */}
                    <View style={styles.headerLeft}>
                        {config.logoUrl && (
                            <Image src={config.logoUrl} style={styles.logo} />
                        )}
                        {fantasy && <Text style={[styles.companyName, { fontSize: 12 }]}>{fantasy}</Text>}
                        <Text style={styles.companyInfo}>{realName}</Text>
                        <Text style={styles.companyInfo}>{address}</Text>
                        {phone && <Text style={styles.companyInfo}>{phone}</Text>}
                        <Text style={styles.companyInfo}>{email}</Text>
                    </View>

                    {/* Center: Letter */}
                    <View style={styles.headerCenter}>
                        <View style={styles.letterContainer}>
                            <Text style={styles.letter}>
                                {invoice.type}
                            </Text>
                            <Text style={styles.letterCode}>
                                {invoice.type === 'A' ? 'COD. 001' : invoice.type === 'B' ? 'COD. 006' : 'COD. 011'}
                            </Text>
                            <Text style={styles.letterLabel}>{config.ivaCondition}</Text>
                        </View>
                    </View>

                    {/* Right: Invoice Specs */}
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
                                    ? `${String(invoice.quoteNumber).padStart(8, '0')}`
                                    : (invoice.status === 'PROVISIONAL' && invoice.draftNumber)
                                        ? `${String(invoice.draftNumber).padStart(8, '0')}`
                                        : (invoice.status === 'DRAFT') ? '---'
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

                {/* Client Section */}
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

                {/* Extra Info Strip */}
                <View style={styles.infoStrip}>
                    <View style={{ flexDirection: 'row', marginRight: 20 }}>
                        <Text style={{ fontWeight: 'bold', marginRight: 5 }}>Condición de Venta:</Text>
                        <Text>{paymentCondition}</Text>
                    </View>
                    {invoice.concept !== 1 && (
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={{ fontWeight: 'bold', marginRight: 5 }}>Período:</Text>
                            <Text>{invoice.serviceFrom ? formatDate(invoice.serviceFrom) : '-'} al {invoice.serviceTo ? formatDate(invoice.serviceTo) : '-'}</Text>
                        </View>
                    )}
                    {invoice.relatedInvoice && (
                        <View style={{ flexDirection: 'row', marginLeft: 20 }}>
                            <Text style={{ fontWeight: 'bold', marginRight: 5 }}>Cmp. Asoc.:</Text>
                            <Text>Fac {invoice.relatedInvoice.type} {String(invoice.relatedInvoice.pointOfSale).padStart(4, '0')}-{String(invoice.relatedInvoice.number).padStart(8, '0')}</Text>
                        </View>
                    )}
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colDesc}>Descripción</Text>
                        <Text style={styles.colQty}>Cant.</Text>
                        <Text style={styles.colPrice}>Precio Unit.</Text>
                        <Text style={styles.colTotal}>Importe</Text>
                    </View>
                    {items.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.colDesc}>{String(item.description || '')}</Text>
                            <Text style={styles.colQty}>{String(item.quantity || 0)}</Text>
                            <Text style={styles.colPrice}>{formatCurrency(Number(item.unitPrice || 0))}</Text>
                            <Text style={styles.colTotal}>{formatCurrency(Number(item.subtotal || 0))}</Text>
                        </View>
                    ))}
                </View>

                {/* Footer / Totals */}
                <View style={styles.footerSection}>
                    {/* IVA Breakdown if needed */}
                    {Number(invoice.ivaAmount) > 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 }}>
                            <Text style={{ fontSize: 8 }}>Subtotal: {formatCurrency(Number(invoice.netAmount))}</Text>
                            <Text style={{ fontSize: 8 }}>IVA: {formatCurrency(Number(invoice.ivaAmount))}</Text>
                        </View>
                    )}

                    {/* Grand Total Bar */}
                    <View style={styles.totalsContainer}>
                        <View style={{ flex: 1 }}>
                            {/* Optional Left side footer text */}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.totalLabel, { marginRight: 10 }]}>TOTAL:</Text>
                            <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrency(Number(invoice.totalAmount))}</Text>
                        </View>
                    </View>

                    {/* CAE & QR */}
                    <View style={styles.caeContainer}>
                        {invoice.status === 'APPROVED' ? (
                            <>
                                <View>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 2 }}>CAE N°: {invoice.cae}</Text>
                                    <Text style={{ fontSize: 9 }}>Fecha Vto. CAE: {invoice.caeExpiresAt ? formatDate(invoice.caeExpiresAt) : ''}</Text>
                                    <Text style={{ fontSize: 8, color: '#666', marginTop: 4 }}>Comprobante Autorizado</Text>
                                </View>
                                {qrImage && <Image src={qrImage} style={styles.qrCode} />}
                            </>
                        ) : (
                            <View style={{ height: 50 }} />
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );
};

