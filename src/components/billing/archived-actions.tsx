'use client'

import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'
import { DeleteInvoiceButton } from '@/components/billing/delete-button'
import { generateInvoiceFilename } from '@/lib/invoice-utils'

type Props = {
    invoice: any
}

export function ArchivedActions({ invoice }: Props) {
    const filename = generateInvoiceFilename(invoice)
    const url = `/api/invoices/${invoice.id}/pdf/download/${filename}`

    return (
        <div className="flex justify-end gap-2">
            {/* Download Icon */}
            <Button
                size="icon"
                variant="ghost"
                title="Descargar"
                onClick={() => window.open(url, '_blank')}
            >
                <Download className="h-4 w-4" />
            </Button>

            {/* Reprint Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, '_blank')}
            >
                <Printer className="mr-2 h-4 w-4" />
                Reimprimir
            </Button>

            <DeleteInvoiceButton id={invoice.id} />
        </div>
    )
}
