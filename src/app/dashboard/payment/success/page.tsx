'use client'

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function PaymentSuccessPage() {
    const { update, data: session } = useSession()
    const router = useRouter()
    const [status, setStatus] = useState("Procesando tu pago...")

    useEffect(() => {
        const refreshSession = async () => {
            try {
                // Force triggering the JWT callback to fetch new data from DB
                await update()

                setStatus("¡Pago confirmado! Actualizando tu cuenta...")

                // Short delay to ensure cookie propagation and UX
                setTimeout(() => {
                    router.refresh() // Refresh server components
                    router.push('/dashboard') // Go to dashboard
                }, 2000)

            } catch (error) {
                console.error("Error updating session", error)
                setStatus("Hubo un error actualizando la sesión. Por favor recarga la página.")
            }
        }

        refreshSession()
    }, [])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Pago Exitoso</h1>
            <p className="text-muted-foreground">{status}</p>
        </div>
    )
}
