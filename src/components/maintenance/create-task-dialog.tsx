'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { createTask } from '@/actions/tasks'
import { toast } from 'sonner'

interface CreateTaskDialogProps {
    clients: {
        id: string
        name: string
        address?: string | null
    }[]
}

export function CreateTaskDialog({ clients }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [clientId, setClientId] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('NORMAL')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!clientId || !description) return

        setLoading(true)
        try {
            const res = await createTask({
                clientId,
                description,
                priority,
                createdBy: 'Admin Manual', // Or fetch current user name via prop if needed, but 'Admin Manual' is fine for context
            })

            if (res.success) {
                toast.success('Tarea creada correctamente')
                setOpen(false)
                // Reset form
                setClientId('')
                setDescription('')
                setPriority('NORMAL')
            } else {
                toast.error(res.error || 'Error al crear tarea')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Tarea
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Nueva Tarea Pendiente</DialogTitle>
                        <DialogDescription>
                            Agrega manualmente una tarea o reclamo para un cliente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="client">Cliente</Label>
                            <Select value={clientId} onValueChange={setClientId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cliente..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción / Reclamo</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej: Ruido en la puerta del piso 3..."
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Prioridad</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NORMAL">Normal</SelectItem>
                                    <SelectItem value="URGENT">Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Tarea
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
