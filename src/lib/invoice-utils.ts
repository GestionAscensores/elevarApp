
/**
 * Generates a consistent filename for invoice downloads according to user preference:
 * "Client Name - Product Description.pdf"
 */
export function generateInvoiceFilename(invoice: any): string {
    const clientName = invoice.client?.name || 'Cliente'
    const productDesc = invoice.items?.[0]?.description || 'Servicios'

    // Sanitize filename to remove invalid characters
    const sanitizedClient = clientName.replace(/[<>:"/\\|?*]/g, '').trim()
    const sanitizedProduct = productDesc.replace(/[<>:"/\\|?*]/g, '').trim()

    let extension = '.pdf'

    // 1. Credit Notes (Check type 'NC...' or if it has a related invoice which implies NC in this system)
    if ((invoice.type && invoice.type.startsWith('NC')) || invoice.relatedInvoiceId) {
        return `Nota de Credito - ${sanitizedClient}${extension}`
    }

    // 2. Quotes (Presupuestos)
    if (invoice.status === 'QUOTE') {
        return `Presupuesto - ${sanitizedClient} - ${sanitizedProduct}${extension}`
    }

    // 3. Defaults (Invoices / Drafts / Provisional)
    // "Nombre del cliente - Producto de la factura"
    return `${sanitizedClient} - ${sanitizedProduct}${extension}`
}
