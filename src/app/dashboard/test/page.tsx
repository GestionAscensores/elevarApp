import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TestPage() {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">✅ Test de Autenticación FUNCIONANDO!</h1>
            <div className="space-y-2">
                <p><strong>Usuario:</strong> {session.user?.name || 'Sin nombre'}</p>
                <p><strong>Email:</strong> {session.user?.email || 'Sin email'}</p>
                <p><strong>Role:</strong> {session.user?.role || 'Sin role'}</p>
                <p><strong>ID:</strong> {session.user?.id || 'Sin ID'}</p>
            </div>
            <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
            </pre>
        </div>
    )
}
