import { getEquipmentStatus } from '@/actions/maintenance'
import { ScanPageManager } from '@/components/maintenance/scan-page-manager'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EquipmentScanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const statusData = await getEquipmentStatus(id)

    if (!statusData) {
        return notFound()
    }

    // Adapt structure for ScanPageManager
    // We combine Equipment Name with Client Name or handle it in manager. 
    // Manager expects basic 'initialData'.

    // We pass combined name to generic display
    const adaptedData = {
        ...statusData,
        clientName: `${statusData.clientName} - ${statusData.equipmentName}`
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-10">
            <ScanPageManager
                clientId={statusData.clientId} // Fix: Use Client ID, not Company ID (userId)
                equipmentId={id}
                initialData={adaptedData}
            />
        </main>
    )
}
