'use client'

import { useState } from 'react'
import { updateClientFrequency } from '@/actions/clients'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ClientFrequencyCellProps {
    clientId: string
    initialFrequency: string
}

const UPDATE_FREQUENCIES = [
    { value: 'MONTHLY', label: 'Mensual' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'SEMIANNUAL', label: 'Semestral' },
    { value: 'YEARLY', label: 'Anual' },
    { value: 'NO', label: 'Sin Act.' },
]

export function ClientFrequencyCell({ clientId, initialFrequency }: ClientFrequencyCellProps) {
    const [frequency, setFrequency] = useState(initialFrequency)
    const [isPending, setIsPending] = useState(false)

    const handleChange = async (newFrequency: string) => {
        setFrequency(newFrequency)
        setIsPending(true)

        try {
            const result = await updateClientFrequency(clientId, newFrequency)
            if (result.success) {
                toast.success("Frecuencia actualizada")
            } else {
                toast.error(result.message || "Error al actualizar")
                // Revert on error
                setFrequency(initialFrequency)
            }
        } catch (error) {
            toast.error("Error de conexión")
            setFrequency(initialFrequency)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Select value={frequency} onValueChange={handleChange} disabled={isPending}>
                <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent shadow-none hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-0">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {UPDATE_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
    )
}
