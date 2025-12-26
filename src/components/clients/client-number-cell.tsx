
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Pencil } from 'lucide-react'
import { updateClientNumber } from '@/actions/clients'
import { toast } from 'sonner'

interface ClientNumberCellProps {
    clientId: string
    initialNumber: number | null
}

export function ClientNumberCell({ clientId, initialNumber }: ClientNumberCellProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [number, setNumber] = useState<string>(initialNumber?.toString() || '')
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        const parsedNumber = number.trim() === '' ? null : parseInt(number)

        if (parsedNumber !== null && isNaN(parsedNumber)) {
            toast.error('Debe ser un número válido')
            setIsLoading(false)
            return
        }

        const result = await updateClientNumber(clientId, parsedNumber)

        if (result.success) {
            toast.success('Número actualizado')
            setIsEditing(false)
        } else {
            toast.error(result.message || 'Error al actualizar')
        }
        setIsLoading(false)
    }

    const handleCancel = () => {
        setNumber(initialNumber?.toString() || '')
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <Input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="h-7 w-20 px-2 py-1 text-xs"
                    autoFocus
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleCancel}
                    disabled={isLoading}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div
            className="group flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1"
            onClick={() => setIsEditing(true)}
        >
            <span className="text-sm font-medium min-w-[1.5rem] inline-block text-center">
                {initialNumber !== null ? `#${initialNumber}` : '-'}
            </span>
            <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    )
}
