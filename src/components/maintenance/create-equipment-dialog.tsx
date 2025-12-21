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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { createEquipment } from '@/actions/equipment'
import { Plus, Ruler, Box } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CreateEquipmentDialog({ clientId }: { clientId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            clientId,
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            description: formData.get('description') as string,
        }

        const res = await createEquipment(data)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Equipo creado correctamente')
            setOpen(false)
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Equipo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Agregar Equipo / Unidad</DialogTitle>
                        <DialogDescription>
                            Registra un nuevo ascensor o equipo para este cliente. Se generará un Código QR automáticamente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Identificador (Nombre)</Label>
                            <Input id="name" name="name" placeholder="Ej: Ascensor Principal" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">Tipo de Equipo</Label>
                            <Select name="type" defaultValue="Ascensor" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ascensor">Ascensor</SelectItem>
                                    <SelectItem value="Montacargas">Montacargas</SelectItem>
                                    <SelectItem value="Escalera Mecánica">Escalera Mecánica</SelectItem>
                                    <SelectItem value="Plataforma">Plataforma</SelectItem>
                                    <SelectItem value="Portón">Portón Automático</SelectItem>
                                    <SelectItem value="Bomba">Bomba de Agua</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción / Ubicación (Opcional)</Label>
                            <Input id="description" name="description" placeholder="Ej: Torre A, Palier Privado" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                            Crear y Generar QR
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
