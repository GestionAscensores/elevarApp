'use client'

import { useState } from 'react'
import { updateTechnicianName } from '@/actions/technicians'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
    id: string
    initialName: string
}

export function InlineTechName({ id, initialName }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(initialName)
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        if (name === initialName) {
            setIsEditing(false)
            return
        }

        if (!name.trim()) {
            toast.error("El nombre no puede estar vacío")
            return
        }

        setIsLoading(true)
        const result = await updateTechnicianName(id, name)
        setIsLoading(false)

        if (result.success) {
            toast.success('Nombre actualizado')
            setIsEditing(false)
        } else {
            toast.error(result.message || 'Error')
            setName(initialName)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
            setName(initialName)
            setIsEditing(false)
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 min-w-[150px]"
                    autoFocus
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={isLoading}>
                    <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => { setIsEditing(false); setName(initialName) }}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div
            className="flex items-center gap-2 cursor-pointer group hover:bg-muted/50 p-1 rounded transition-colors"
            onClick={() => setIsEditing(true)}
        >
            <span className="text-xl font-bold">{name}</span>
            <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    )
}
