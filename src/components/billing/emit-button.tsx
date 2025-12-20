'use client'

import { useState } from 'react'
import { emitInvoice } from '@/actions/billing'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { startTransition } from 'react'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function EmitInvoiceButton({ id }: { id: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleEmit = async () => {
        setIsLoading(true)
        try {
            const res = await emitInvoice(id)
            if (res.success) {
                toast.success('Factura emitida correctamente')
                setOpen(false)
            } else {
                toast.error(res.message || 'Error al emitir')
            }
        } catch (error) {
            toast.error('Error de red')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Emitir a ARCA
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar emisión a ARCA?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción reportará la factura a ARCA (ex AFIP) y no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.preventDefault(); handleEmit() }} disabled={isLoading}>
                        Confirmar Emisión
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
