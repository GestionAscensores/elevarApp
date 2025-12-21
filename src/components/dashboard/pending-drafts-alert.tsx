import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText, ArrowRight } from "lucide-react"
import { Button } from '@/components/ui/button'

export function PendingDraftsAlert({ count }: { count: number }) {
    if (count === 0) return null

    return (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <FileText className="h-4 w-4 stroke-amber-600" />
            <AlertTitle className="text-amber-800">Facturas Pendientes</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span>
                    Tienes <strong>{count} borradores</strong> de facturas generados automáticamente que esperan tu revisión y emisión a ARCA.
                </span>
                <Button variant="outline" size="sm" className="bg-white border-amber-200 hover:bg-amber-100 text-amber-700 hover:text-amber-800" asChild>
                    <Link href="/dashboard/billing?status=DRAFT">
                        Revisar Borradores <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                </Button>
            </AlertDescription>
        </Alert>
    )
}
