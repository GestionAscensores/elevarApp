'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateTechnicianPin } from '@/actions/technicians'
import { toast } from 'sonner'
import { Loader2, Lock } from 'lucide-react'

interface TechLoginModalProps {
    companyId: string
    onLoginSuccess: (tech: { id: string, name: string }) => void
}

export function TechLoginModal({ companyId, onLoginSuccess }: TechLoginModalProps) {
    const [pin, setPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const tech = await validateTechnicianPin(companyId, pin)

        if (tech) {
            toast.success(`Bienvenido ${tech.name}`)
            onLoginSuccess(tech)
            setOpen(false)
        } else {
            toast.error('PIN incorrecto o técnico inactivo')
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-full shadow-md bg-white/90 backdrop-blur text-sm h-10 px-6 fixed bottom-6 right-6 z-50">
                    <Lock className="h-4 w-4" />
                    Soy Técnico
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Acceso Técnico</DialogTitle>
                    <DialogDescription>
                        Ingresa tu PIN personal de 4 dígitos para registrar una visita.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLogin} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="pin" className="text-center">PIN de Acceso</Label>
                        <Input
                            id="pin"
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="text-center text-3xl tracking-[1em] font-mono h-16"
                            placeholder="••••"
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || pin.length < 4}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ingresar
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
