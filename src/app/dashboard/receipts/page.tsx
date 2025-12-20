import { getReceipts } from '@/actions/receipts'
import { ReceiptList } from '@/components/receipts/receipt-list'

export default async function ReceiptsPage() {
    const receipts = await getReceipts()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Recibos</h1>
            <ReceiptList receipts={receipts} />
        </div>
    )
}
