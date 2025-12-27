import { getUsers } from '@/actions/users'
import { getAdminMetrics } from '@/actions/admin'
import { getSubscriptionPrice } from '@/actions/settings' // Fetch Price
import { UserList } from '@/components/admin/user-list'
import { AdminStats } from '@/components/admin/admin-stats'
import { PricingConfig } from '@/components/admin/pricing-config' // New Component
import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CleanupZone } from '@/components/admin/cleanup-zone'
import { TestUserInfo } from '@/components/admin/test-user-info'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') redirect('/dashboard')

    // Fetch Data in Parallel
    const [users, stats, currentPrice] = await Promise.all([
        getUsers(),
        getAdminMetrics(),
        getSubscriptionPrice()
    ])

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Administración</h1>
                <p className="text-muted-foreground">Visión general del sistema y gestión de usuarios.</p>
            </div>

            {/* Test User Info */}
            <section>
                <TestUserInfo />
            </section>

            {/* Platform Stats */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Métricas de la Plataforma</h2>
                {stats ? (
                    <AdminStats metrics={stats} />
                ) : (
                    <div className="p-4 border border-red-200 rounded text-red-600 bg-red-50 text-sm">
                        Error al cargar estadísticas.
                    </div>
                )}
            </section>

            {/* Configuration Zone (Price) */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Configuración del Sistema</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <PricingConfig currentPrice={currentPrice} />
                    {/* Future gadgets can go here */}
                </div>
            </section>

            <div className="border-t my-6" />

            {/* User Management */}
            <section>
                <div className="mb-4">
                    <h2 className="text-xl font-semibold">Usuarios Registrados</h2>
                    <p className="text-sm text-muted-foreground">Gestión de acceso y roles.</p>
                </div>

                <div className="bg-white rounded-lg border shadow-sm p-1">
                    <UserList users={users} currentUserId={session.userId} />
                </div>
            </section>

            {/* Danger Zone */}
            <CleanupZone />
        </div>
    )
}
