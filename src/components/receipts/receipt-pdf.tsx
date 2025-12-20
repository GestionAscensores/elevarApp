import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#000'
    },
    header: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 10,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    infoColumn: {
        flexDirection: 'column',
        alignItems: 'flex-end'
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5
    },
    label: {
        fontWeight: 'bold',
        marginRight: 5
    },
    value: {

    },
    clientSection: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 4
    },
    descriptionSection: {
        marginTop: 20,
        marginBottom: 20,
        minHeight: 100
    },
    totalSection: {
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 10,
        alignItems: 'flex-end'
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 10
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold'
    }
});

type ReceiptPDFProps = {
    receipt: any;
    user: any;
};

export const ReceiptPDF = ({ receipt, user }: ReceiptPDFProps) => {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-AR');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
    };

    const config = user.config || {}

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        {config.logoUrl && (
                            <Image src={config.logoUrl} style={{ width: 100, height: 50, objectFit: 'contain', marginBottom: 5 }} />
                        )}
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{config.businessName || user.name}</Text>
                        <Text style={{ fontSize: 9 }}>{config.businessAddress || user.address}</Text>
                        <Text style={{ fontSize: 9 }}>{user.email}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                        <Text style={styles.title}>RECIBO X</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>N°:</Text>
                            <Text style={styles.value}>{String(receipt.number).padStart(6, '0')}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Fecha:</Text>
                            <Text style={styles.value}>{formatDate(receipt.date)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.clientSection}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 2 }}>
                        Recibí de:
                    </Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text style={styles.value}>{receipt.client.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>CUIT:</Text>
                        <Text style={styles.value}>{receipt.client.cuit}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Dirección:</Text>
                        <Text style={styles.value}>{receipt.client.address || '-'}</Text>
                    </View>
                </View>

                <View style={styles.descriptionSection}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Concepto:</Text>
                    <Text>{receipt.description || 'Pago a cuenta'}</Text>
                </View>

                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(Number(receipt.totalAmount))}</Text>
                    </View>
                    <Text style={{ fontSize: 8, marginTop: 5, fontStyle: 'italic' }}>
                        Documento no válido como factura
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
