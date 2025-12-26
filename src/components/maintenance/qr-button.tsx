'use client'

import { Button } from '@/components/ui/button'
import { QrCode } from 'lucide-react'
import Link from 'next/link'

export function QRButton({ clientId }: { clientId: string }) {
    return (
        <Button variant="outline" className="gap-2" asChild>
            <Link href={`/dashboard/clients/${clientId}/qr-poster`} target="_blank">
                <QrCode className="h-4 w-4" />
                Imprimir QR
            </Link>
        </Button>
    )
}
