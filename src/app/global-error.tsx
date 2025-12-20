'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen p-4">
                    <h2 className="text-2xl font-bold mb-4">Algo salió mal (Global Error)</h2>
                    <pre className="bg-gray-100 p-4 rounded mb-4 max-w-lg overflow-auto text-sm text-red-600">
                        {error.message}
                    </pre>
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => reset()}
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </body>
        </html>
    )
}
