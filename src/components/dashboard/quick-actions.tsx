'use client'

import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Plus, Building, Calculator } from "lucide-react"

export function QuickActions() {
    return (
        <div className="flex flex-wrap gap-4 mb-6">
            <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white" asChild>
                <Link href="/dashboard/billing/new">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Nueva Factura</span>
                </Link>
            </Button>

            <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white" asChild>
                <Link href="/dashboard/clients/new">
                    <Building className="mr-2 h-4 w-4" />
                    <span>Nuevo Edificio</span>
                </Link>
            </Button>

            <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white" asChild>
                <Link href="/dashboard/billing/budgets/new">
                    <Calculator className="mr-2 h-4 w-4" />
                    <span>Nuevo Presupuesto</span>
                </Link>
            </Button>
        </div>
    )
}
