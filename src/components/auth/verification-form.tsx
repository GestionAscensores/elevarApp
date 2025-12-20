'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyEmailCode } from '@/actions/verification'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { logout } from '@/actions/auth'

export function VerificationForm() {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (code.length !== 6) {
            toast.error('El código debe tener 6 dígitos')
            return
        }

        setLoading(true)
        try {
            const result = await verifyEmailCode(code)

            if (result.success) {
                toast.success('Email verificado exitosamente')
                // Force logout to clear stale session and login again
                // The action already calls deleteSession, but we need to redirect
                router.push('/login')
            } else {
                toast.error(result.error || 'Código incorrecto')
            }
        } catch (error) {
            toast.error('Error al verificar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="code" className="text-center block">Código de 6 dígitos</Label>
                <div className="flex justify-center">
                    <Input
                        id="code"
                        name="code"
                        type="text"
                        maxLength={6}
                        className="text-center text-2xl tracking-widest max-w-[200px]"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        required
                    />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                    Enviado a tu email registrado.
                </p>
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700" type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verificar Cuenta
            </Button>

            <div className="text-center mt-4">
                <button
                    type="button"
                    onClick={() => logout()}
                    className="text-sm text-muted-foreground hover:underline"
                >
                    Cerrar Sesión / Cancelar
                </button>
            </div>
        </form>
    )
}
