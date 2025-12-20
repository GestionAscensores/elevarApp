import { verifySession } from '@/lib/session'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await verifySession()

    // Safety check - Middleware should catch this, but just in case
    // if (!session) {
    //     redirect('/login')
    // }

    // Fetch basic user info for the shell if we have a userId
    let user = null
    if (session?.userId) {
        user = await db.user.findUnique({
            where: { id: session.userId },
            select: {
                name: true,
                email: true,
                role: true
            }
        })
    }

    return (
        <DashboardShell user={user}>
            {children}
        </DashboardShell>
    )
}
