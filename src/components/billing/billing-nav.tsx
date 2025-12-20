
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function BillingNav() {
    const pathname = usePathname()

    return (
        <div className="flex space-x-2 pb-4">
            <Link
                href="/dashboard/billing"
                className={cn(
                    buttonVariants({ variant: pathname === '/dashboard/billing' ? 'default' : 'outline' })
                )}
            >
                Historial (ARCA)
            </Link>
            <Link
                href="/dashboard/billing/new"
                className={cn(
                    buttonVariants({ variant: pathname === '/dashboard/billing/new' ? 'default' : 'outline' })
                )}
            >
                Facturar Trabajo
            </Link>
            <Link
                href="/dashboard/billing/mass"
                className={cn(
                    buttonVariants({ variant: pathname.includes('/mass') ? 'default' : 'outline' })
                )}
            >
                Facturación Masiva
            </Link>
        </div>
    )
}
