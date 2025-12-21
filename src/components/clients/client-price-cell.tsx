'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { updateClientPrice } from '@/actions/clients'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ClientPriceCellProps {
    clientId: string
    initialPrice: number
}

export function ClientPriceCell({ clientId, initialPrice }: ClientPriceCellProps) {
    const [price, setPrice] = useState(initialPrice)
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Sync if initialPrice changes externally (e.g. revalidation)
    useEffect(() => {
        setPrice(initialPrice)
    }, [initialPrice])

    const handleBlur = async () => {
        setIsEditing(false)
        if (price === initialPrice) return

        setIsLoading(true)
        const result = await updateClientPrice(clientId, price)
        setIsLoading(false)

        if (result.success) {
            toast.success('Precio actualizado')
        } else {
            setPrice(initialPrice) // Revert
            toast.error(result.message || 'Error al actualizar')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur()
        }
    }

    // Format currency for display
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

    if (isLoading) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }

    if (isEditing) {
        return (
            <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-8 w-32"
                autoFocus
            />
        )
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-muted/50 p-1 rounded px-2 font-bold"
        >
            {formatter.format(price)}
        </div>
    )
}
