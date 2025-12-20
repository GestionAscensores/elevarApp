'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ForceLogoutPage() {
    const router = useRouter()

    useEffect(() => {
        // Forzar logout completo
        signOut({
            callbackUrl: '/login',
            redirect: true
        })
    }, [])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Cerrando sesión...</h1>
                <p className="text-gray-600">Redirigiendo al login</p>
            </div>
        </div>
    )
}
