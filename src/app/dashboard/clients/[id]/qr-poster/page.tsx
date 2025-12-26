import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { QRPoster } from '@/components/maintenance/qr-poster'

export default async function QRPosterPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession()
    if (!session) redirect('/login')

    const { id } = await params
    const client = await db.client.findUnique({
        where: { id, userId: session.userId },
        include: {
            user: {
                include: {
                    config: true
                }
            }
        }
    })

    if (!client) notFound()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const scanUrl = `${appUrl}/scan/${client.id}`
    const qrDataUrl = await QRCode.toDataURL(scanUrl, { width: 400, margin: 2 })

    return (
        <QRPoster
            clientName={client.name}
            address={client.address || ''}
            qrDataUrl={qrDataUrl}
            logoUrl={client.user.config?.logoUrl}
            fantasyName={client.user.config?.fantasyName}
        />
    )
}
