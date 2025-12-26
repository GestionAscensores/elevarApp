'use client'

import { useState } from 'react'
import { updateTechnicianPin } from '@/actions/technicians'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Pencil, Key } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
    id: string
    initialPin: string
}

export function InlineTechPin({ id, initialPin }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [pin, setPin] = useState(initialPin)
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        if (pin === initialPin) {
            setIsEditing(false)
            return
        }

        if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
            toast.error("El PIN debe ser de 4 números")
            return
        }

        setIsLoading(true)
        const result = await updateTechnicianPin(id, pin)
        setIsLoading(false)

        if (result.success) {
            toast.success('PIN actualizado')
            setIsEditing(false)
        } else {
            toast.error(result.message || 'Error')
            setPin(initialPin)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
            setPin(initialPin)
            setIsEditing(false)
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 mt-2 text-xs">
                <Input
                    value={pin}
                    onChange={(e) => setPin(e.target.value.slice(0, 4))}
                    className="h-7 w-20 font-mono tracking-widest text-center"
                    autoFocus
                    type="tel"
                    inputMode="numeric"
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={handleSave} disabled={isLoading}>
                    <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => { setIsEditing(false); setPin(initialPin) }}>
                    <X className="h-3 w-3" />
                </Button>
            </div>
        )
    }

    return (
        <div
            className="flex items-center mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md font-mono cursor-pointer group hover:bg-muted transition-colors"
            onClick={() => setIsEditing(true)}
        >
            <Key className="mr-2 h-3 w-3" />
            PIN: <span className="tracking-widest ml-1">{pin}</span>
            <Pencil className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    )
}
