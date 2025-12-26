import { getPublicStatus } from '@/actions/maintenance'
import { ScanPageManager } from '@/components/maintenance/scan-page-manager'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const statusData = await getPublicStatus(id)

    if (!statusData) {
        return notFound()
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-10">
            <ScanPageManager
                clientId={id}
                initialData={statusData}
            />
        </main>
    )
}
