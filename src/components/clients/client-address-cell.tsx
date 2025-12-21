'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { updateClientAddress } from '@/actions/clients'
import { toast } from 'sonner'
import { Loader2, MapPin } from 'lucide-react'

interface ClientAddressCellProps {
    clientId: string
    initialAddress: string
}

export function ClientAddressCell({ clientId, initialAddress }: ClientAddressCellProps) {
    const [address, setAddress] = useState(initialAddress || '')
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Sync if initialAddress changes externally
    useEffect(() => {
        setAddress(initialAddress || '')
    }, [initialAddress])

    const handleBlur = async () => {
        setIsEditing(false)
        if (address === (initialAddress || '')) return

        setIsLoading(true)
        const result = await updateClientAddress(clientId, address)
        setIsLoading(false)

        if (result.success) {
            toast.success('Dirección actualizada')
        } else {
            setAddress(initialAddress || '') // Revert
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-8 min-w-[200px]"
                autoFocus
                placeholder="Sin dirección"
            />
        )
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 cursor-pointer group hover:bg-muted/50 p-1 rounded min-w-[100px] min-h-[1.5rem]"
            title="Clic para editar dirección"
        >
            {address ? (
                <span>{address}</span>
            ) : (
                <span className="text-muted-foreground text-xs italic">Agregar dirección...</span>
            )}
            <MapPin className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-50 ml-auto" />
        </div>
    )
}
