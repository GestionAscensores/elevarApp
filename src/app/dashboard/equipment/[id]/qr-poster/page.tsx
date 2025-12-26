import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { QRPoster } from '@/components/maintenance/qr-poster'

export default async function EquipmentQRPosterPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession()
    if (!session) redirect('/login')

    const { id } = await params
    const equipment = await db.equipment.findUnique({
        where: { id },
        include: {
            client: {
                include: {
                    user: {
                        include: {
                            config: true
                        }
                    }
                }
            }
        }
    })

    if (!equipment) notFound()

    // Verify ownership
    if (equipment.client.userId !== session.userId) {
        return notFound()
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const scanUrl = `${appUrl}/scan/equipment/${equipment.id}`
    const qrDataUrl = await QRCode.toDataURL(scanUrl, { width: 400, margin: 2 })

    return (
        <QRPoster
            clientName={equipment.client.name}
            equipmentName={equipment.name}
            address={equipment.client.address || ''}
            qrDataUrl={qrDataUrl}
            logoUrl={equipment.client.user.config?.logoUrl}
            fantasyName={equipment.client.user.config?.fantasyName}
        />
    )
}
