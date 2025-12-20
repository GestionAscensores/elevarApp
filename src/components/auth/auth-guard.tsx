'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        // Check for custom session cookie
        const hasCustomSession = document.cookie.includes('session=')

        if (status === 'unauthenticated' && !hasCustomSession) {
            router.push('/login')
        }
    }, [status, router])

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // Allow render if authenticated OR if custom session exists
    // (We can't easily verify the cookie validity on client, but the API calls/Middleware will block if invalid)
    const hasCustomSession = typeof document !== 'undefined' && document.cookie.includes('session=')

    if (status === 'unauthenticated' && !hasCustomSession) {
        return null
    }

    return <>{children}</>
}
