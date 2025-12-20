import { getReceipts } from '@/actions/receipts'
import { ReceiptList } from '@/components/receipts/receipt-list'

export default async function ReceiptsPage() {
    const rawReceipts = await getReceipts()

    const receipts = rawReceipts.map((r: any) => ({
        ...r,
        amount: r.amount ? Number(r.amount) : 0,
        totalAmount: r.totalAmount ? Number(r.totalAmount) : 0, // Fallback if schema differs
        invoices: r.invoices?.map((inv: any) => ({
            ...inv,
            // If invoices inside receipt have decimals
            totalAmount: inv.totalAmount ? Number(inv.totalAmount) : 0
        }))
    }))

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Recibos</h1>
            <ReceiptList receipts={receipts} />
        </div>
    )
}
