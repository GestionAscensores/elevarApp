'use client'

import { sendInvoiceEmail } from '@/actions/email'
import { Button } from '@/components/ui/button'
import { Loader2, Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function EmailButton({ invoiceId, hasEmail, sentCount = 0 }: { invoiceId: string, hasEmail: boolean, sentCount?: number }) {
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
                // Optionally trigger reload or optimistic update?
                // For now user can see toast.
                // To update count instantly without refresh, we need router.refresh() or local state increment.
                // Let's do router refresh to be clean (although slower) or just rely on toast.
                window.location.reload() // Force reload to see new count
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
            title={hasEmail ? (sentCount > 0 ? `Enviado ${sentCount} veces` : "Enviar por Email") : "Cliente sin Email"}
            className={`relative ${!hasEmail ? "opacity-50" : ""} ${sentCount > 0 ? "text-green-600 hover:text-green-700 hover:bg-green-50" : ""}`}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {sentCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] text-white font-bold">
                    {sentCount}
                </span>
            )}
        </Button>
    )
}
