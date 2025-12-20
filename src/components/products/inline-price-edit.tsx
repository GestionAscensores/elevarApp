'use client'

import { useState } from 'react'
import { updateProductPrice } from '@/actions/products'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
    id: string
    initialPrice: number
    currency: string
}

export function InlinePriceEdit({ id, initialPrice, currency }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [price, setPrice] = useState(initialPrice)
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        if (price === initialPrice) {
            setIsEditing(false)
            return
        }

        setIsLoading(true)
        const result = await updateProductPrice(id, price)
        setIsLoading(false)

        if (result.success) {
            toast.success('Precio actualizado')
            setIsEditing(false)
        } else {
            toast.error(result.message || 'Error')
            setPrice(initialPrice) // Revert
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
            setPrice(initialPrice)
            setIsEditing(false)
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 justify-end">
                <span className="text-sm text-muted-foreground mr-1">{currency === 'ARS' ? '$' : 'USD'}</span>
                <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                    className="h-8 w-24 text-right"
                    step="0.01"
                    autoFocus
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={isLoading}>
                    <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => { setIsEditing(false); setPrice(initialPrice) }}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div
            className="flex items-center justify-end gap-2 cursor-pointer group hover:bg-muted/50 p-1 rounded transition-colors"
            onClick={() => setIsEditing(true)}
        >
            <span className="font-bold">
                {currency === 'ARS' ? '$' : 'USD'} {price.toFixed(2)}
            </span>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    )
}
