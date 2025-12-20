import { MassInvoiceForm } from '@/components/billing/mass-invoice-form'
import { getClients } from '@/actions/clients'
import { getProducts } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function MassBillingPage() {
    const clients = await getClients()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/billing">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Facturación Masiva de Abonos</h1>
            </div>
            <MassInvoiceForm clients={clients} />
        </div>
    )
}
