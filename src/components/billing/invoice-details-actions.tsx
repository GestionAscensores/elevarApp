'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { emitInvoice, markAsProvisional } from '@/actions/billing'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Printer, Send, FileEdit, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { InvoiceDownloadButton } from './invoice-download'
import { PrintDraftButton } from '@/components/billing/print-draft-button'

interface InvoiceDetailsActionsProps {
    invoice: any
    isReadOnly?: boolean
}

export function InvoiceDetailsActions({ invoice, isReadOnly = false }: InvoiceDetailsActionsProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleEmit = async () => {
        if (!confirm('¿Confirma la emisión de la factura a AFIP? Esta acción no se puede deshacer.')) return

        setLoading(true)
        try {
            const res = await emitInvoice(invoice.id)
            if (res.success) {
                toast.success('Factura emitida correctamente')
                router.refresh()
            } else {
                toast.error(res.message || 'Error al emitir')
            }
        } catch (e) {
            toast.error('Error inesperado')
        } finally {
            setLoading(false)
        }
    }



    const isDraft = invoice.status === 'DRAFT'
    const isProvisional = invoice.status === 'PROVISIONAL'
    const isApproved = invoice.status === 'APPROVED'

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {(isDraft || isProvisional) && !isReadOnly && (
                <>
                    <Button variant="secondary" asChild disabled={loading}>
                        <Link href={`/dashboard/billing/${invoice.id}/edit`}>
                            <FileEdit className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </Button>

                    <PrintDraftButton invoice={invoice} />

                    <Button onClick={handleEmit} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Emitir Factura
                    </Button>
                </>
            )}

            {/* In ReadOnly mode for draft/provisional, we might still want to show download/print logic if it's provisional? 
                User asked "elimines los botones editar y emitir". 
                Usually "Imprimir Borrador" (Mark as provisional) is an action too.
                But "Download" should persist.
                Let's assume "Download" stays.
            */}
            {(isDraft || isProvisional) && isReadOnly && !isProvisional && (
                <span className="text-muted-foreground italic text-sm">Vista solo lectura</span>
            )}

            {isProvisional && (
                <InvoiceDownloadButton
                    invoice={invoice}
                />
            )}

            {isApproved && (
                <InvoiceDownloadButton invoice={invoice} />
            )}
        </div>
    )
}
