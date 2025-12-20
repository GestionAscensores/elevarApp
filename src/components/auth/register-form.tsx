'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { register } from '@/actions/auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import Link from 'next/link'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button className="w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Cuenta
        </Button>
    )
}

export function RegisterForm() {
    const [state, action] = useActionState(register, undefined)

    return (
        <form action={action} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                />
                {state?.errors?.email && (
                    <p className="text-sm text-red-500">{state.errors.email[0]}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="cuit">CUIT (Opcional)</Label>
                <Input
                    id="cuit"
                    name="cuit"
                    type="text"
                    placeholder="20123456789"
                />
                {state?.errors?.cuit && (
                    <p className="text-sm text-red-500">{state.errors.cuit[0]}</p>
                )}
                <p className="text-xs text-muted-foreground">Puedes agregarlo después en tu perfil.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                />
                {state?.errors?.password && (
                    <p className="text-sm text-red-500">{state.errors.password[0]}</p>
                )}
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox id="acceptTerms" name="acceptTerms" required />
                <label
                    htmlFor="acceptTerms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Acepto la declaración jurada y términos de uso.
                </label>
            </div>
            {state?.errors?.acceptTerms && (
                <p className="text-sm text-red-500">{state.errors.acceptTerms}</p>
            )}

            {state?.message && (
                <p className="text-sm text-red-500 text-center">{state.message}</p>
            )}

            <SubmitButton />
        </form>
    )
}
