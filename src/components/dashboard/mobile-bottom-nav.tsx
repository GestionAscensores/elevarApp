'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Barcode, Wrench, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface MobileBottomNavProps {
    onMenuClick: () => void
}

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
    const pathname = usePathname()

    const navItems = [
        {
            label: 'Inicio',
            href: '/dashboard',
            icon: Home,
            active: pathname === '/dashboard'
        },
        {
            label: 'Escanear',
            href: '/dashboard/inventory/scan',
            icon: Barcode,
            active: pathname === '/dashboard/inventory/scan'
        },
        {
            label: 'Repuestos',
            href: '/dashboard/pricing',
            icon: Wrench,
            active: pathname === '/dashboard/pricing'
        }
    ]

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-slate-200 md:hidden flex items-center justify-around px-2 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1",
                        item.active ? "text-primary" : "text-slate-500 hover:text-slate-900"
                    )}
                >
                    <item.icon className={cn("h-6 w-6", item.active && "fill-current")} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
            ))}

            <button
                onClick={onMenuClick}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-900"
            >
                <Menu className="h-6 w-6" />
                <span className="text-[10px] font-medium">Menú</span>
            </button>
        </div>
    )
}
