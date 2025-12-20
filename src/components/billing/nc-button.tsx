'use client'

import { createCreditNote } from '@/actions/billing'
import { Button } from '@/components/ui/button'
import { FileMinus } from 'lucide-react'
import { toast } from 'sonner'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

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
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export function CreateCreditNoteButton({ invoiceId }: { invoiceId: string }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    const handleCreate = () => {
        startTransition(async () => {
            const result = await createCreditNote(invoiceId)
            if (result.success) {
                toast.success('Nota de Crédito generada')
                setOpen(false)
                router.push(`/dashboard/billing/${result.invoiceId}/edit`)
            } else {
                console.error("NC Error:", result.message)
                toast.error('Error: ' + result.message)
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isPending}
                    title="Generar Nota de Crédito"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileMinus className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Generar Nota de Crédito?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Se creará un borrador de Nota de Crédito vinculado a esta factura.
                        Podrás editar el borrador antes de emitirlo.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.preventDefault(); handleCreate() }} disabled={isPending}>
                        Generar Borrador
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
