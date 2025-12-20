'use client'

import { sendInvoiceEmail } from '@/actions/email'
import { Button } from '@/components/ui/button'
import { Loader2, Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function EmailButton({ invoiceId, hasEmail }: { invoiceId: string, hasEmail: boolean }) {
    const [loading, setLoading] = useState(false)

    const handleSend = async () => {
        if (!hasEmail) {
            toast.error("El cliente no tiene email registrado.")
            return
        }

        setLoading(true)
        try {
            const res = await sendInvoiceEmail(invoiceId)
            if (res.success) {
                toast.success(res.message)
            } else {
                toast.error(res.message)
            }
        } catch (e) {
            toast.error("Error desconocido")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleSend}
            disabled={loading || !hasEmail}
            title={hasEmail ? "Enviar por Email" : "Cliente sin Email"}
            className={!hasEmail ? "opacity-50" : ""}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        </Button>
    )
}
