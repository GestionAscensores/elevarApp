'use client'

import { deleteClient } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { startTransition } from 'react'

export function ClientActions({ id }: { id: string }) {

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return

        const res = await deleteClient(id)
        if (res.success) {
            toast.success('Cliente eliminado')
        } else {
            toast.error(res.message || 'Error al eliminar')
        }
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" asChild title="Editar">
                <Link href={`/dashboard/clients/${id}/edit`}>
                    <Pencil className="h-4 w-4 text-blue-600" />
                </Link>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => startTransition(handleDelete)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                title="Eliminar"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}
