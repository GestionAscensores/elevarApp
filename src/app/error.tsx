'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
            <p className="mb-4 text-muted-foreground">{error.message}</p>
            <button
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                onClick={() => reset()}
            >
                Intentar de nuevo
            </button>
        </div>
    )
}
