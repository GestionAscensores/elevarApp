'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { updateClientName } from '@/actions/clients'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ClientNameCellProps {
    clientId: string
    initialName: string
}

export function ClientNameCell({ clientId, initialName }: ClientNameCellProps) {
    const [name, setName] = useState(initialName)
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Sync if initialName changes externally
    useEffect(() => {
        setName(initialName)
    }, [initialName])

    const handleBlur = async () => {
        setIsEditing(false)
        if (name === initialName) return
        if (!name.trim()) {
            setName(initialName)
            return
        }

        setIsLoading(true)
        const result = await updateClientName(clientId, name)
        setIsLoading(false)

        if (result.success) {
            toast.success('Nombre actualizado')
        } else {
            setName(initialName) // Revert
            toast.error(result.message || 'Error al actualizar')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur()
        }
    }

    if (isLoading) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }

    if (isEditing) {
        return (
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-8 min-w-[200px]"
                autoFocus
            />
        )
    }

    return (
        <div className="flex items-center group">
            <Link
                href={`/dashboard/clients/${clientId}`}
                className="hover:underline text-primary font-medium mr-2"
            >
                {name}
            </Link>
            <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground p-1"
                title="Editar nombre rápido"
            >
                ✎
            </button>
        </div>
    )
}
