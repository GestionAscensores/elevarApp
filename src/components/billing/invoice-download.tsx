'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { useState } from 'react'

import { generateInvoiceFilename } from '@/lib/invoice-utils'

export function InvoiceDownloadButton({ invoice, customFilename }: { invoice: any, customFilename?: string }) {
    const [loading, setLoading] = useState(false)

    const filename = customFilename || generateInvoiceFilename(invoice)

    // Friendly URL: /api/invoices/[id]/pdf/download/[filename]
    const url = `/api/invoices/${invoice.id}/pdf/download/${filename}`

    return (
        <Button
            variant="ghost"
            size="sm"
            asChild
            title="Descargar PDF"
        >
            <a href={url} download>
                <FileDown className="h-4 w-4 mr-1" />
            </a>
        </Button>
    )
}
