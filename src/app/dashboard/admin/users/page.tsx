
import { getUsers } from '@/actions/users'
import { UserList } from '@/components/admin/user-list'
import { verifySession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminUsersPage() {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') {
        return redirect('/dashboard')
    }

    const users = await getUsers()

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Administración de Usuarios</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Registrados</CardTitle>
                    <CardDescription>Gestión de acceso y roles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserList users={users} currentUserId={session.userId} />
                </CardContent>
            </Card>
        </div>
    )
}
