'use client'

import { useState } from 'react'
import { markAsProvisional } from '@/actions/billing'
import { Button } from '@/components/ui/button'
import { Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { generateInvoiceFilename } from '@/lib/invoice-utils'

export function PrintDraftButton({ invoice }: { invoice: any }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handlePrint = async () => {
        const filename = generateInvoiceFilename(invoice)

        // If already provisional, just download
        if (invoice.status === 'PROVISIONAL' && invoice.draftNumber) {
            window.open(`/api/invoices/${invoice.id}/pdf/download/${filename}`, '_blank')
            return
        }

        // If DRAFT, mark as provisional first
        setIsLoading(true)
        try {
            const res = await markAsProvisional(invoice.id)
            if (res.success && res.draftNumber) {
                toast.success('Generando provisional...')
                // Open PDF with new number, but we need to reconstruct filename with new status potentially?
                // Actually the filename format "Client - Item" doesn't change with status/number usually. 
                // But if we included number, we would need the new number.
                // Since our new format is "Client - Item", we can reuse the generated filename.

                window.open(`/api/invoices/${invoice.id}/pdf/download/${filename}`, '_blank')
                router.refresh()
            } else {
                toast.error(res.message || 'Error al actualizar borrador')
            }
        } catch (error) {
            toast.error('Error de red')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handlePrint}
            disabled={isLoading}
            title={status === 'PROVISIONAL' ? "Imprimir Provisional" : "Generar PDF Borrador"}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        </Button>
    )
}
