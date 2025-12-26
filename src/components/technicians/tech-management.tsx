'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createTechnician, deleteTechnician } from '@/actions/technicians'
import { Plus, User, Trash2, Key } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Technician {
    id: string
    name: string
    pin: string
    isActive: boolean
}

export function TechManagement({ initialTechnicians }: { initialTechnicians: Technician[] }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const res = await createTechnician(formData)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Técnico creado", {
                description: "El técnico ha sido registrado exitosamente."
            })
            setOpen(false)
            router.refresh()
        }
        setIsLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de desactivar este técnico?')) return

        const res = await deleteTechnician(id)
        if (res.success) {
            toast.success("Técnico desactivado")
            router.refresh()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Técnico
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nuevo Técnico</DialogTitle>
                            <DialogDescription>
                                Crea un perfil para tu empleado. El PIN será su contraseña para fichar.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Nombre
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Juan Pérez"
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="pin" className="text-right">
                                        PIN (4 núm)
                                    </Label>
                                    <Input
                                        id="pin"
                                        name="pin"
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]{4}"
                                        maxLength={4}
                                        placeholder="1234"
                                        className="col-span-3 font-mono tracking-widest"
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Guardando...' : 'Crear Técnico'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {initialTechnicians.map((tech) => (
                    <Card key={tech.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Técnico
                            </CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{tech.name}</div>
                            <div className="flex items-center mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md font-mono">
                                <Key className="mr-2 h-3 w-3" />
                                PIN: {tech.pin}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end pt-0">
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(tech.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {initialTechnicians.length === 0 && (
                    <div className="col-span-full text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                        No hay técnicos registrados. Agrega uno para comenzar.
                    </div>
                )}
            </div>
        </div>
    )
}
