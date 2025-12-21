'use client'

import Link from 'next/link'
import {
    Building, // Icon for Edificios
    FileText,
    Settings,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Menu,
    ChevronDown,
    Users, // Re-added for Admin
    FilePlus, // New Invoice
    FileStack, // Budgets
    Archive, // Archived
    Receipt, // Receipts
    FileDiff // Credit Note
    // Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { signOut } from 'next-auth/react'
import { logout } from '@/actions/auth' // Custom logout action
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
// AuthGuard removed - rely on Server Layout / Middleware
// import AuthGuard from '@/components/auth/auth-guard'

interface DashboardShellProps {
    children: React.ReactNode
    user: {
        name?: string | null
        email?: string | null
        role: string
        config?: {
            fantasyName?: string | null
            businessName?: string | null
        } | null
    } | null
}

export function DashboardShell({ children, user }: DashboardShellProps) {
    // Nav Items definition
    const navItems = [
        { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
        {
            label: 'Facturación',
            icon: FileText,
            children: [
                { href: '/dashboard/billing/invoices', label: 'Facturas', icon: FilePlus },
                { href: '/dashboard/billing/budgets', label: 'Presupuestos', icon: FileStack },
                { href: '/dashboard/billing/archived', label: 'Archivadas sin emitir', icon: Archive },
                { href: '/dashboard/billing/credit-notes', label: 'Notas de Crédito', icon: FileDiff },
                { href: '/dashboard/receipts', label: 'Recibos', icon: Receipt },
            ]
        },
        // Change "Clientes" to "Edificios" with Building Icon
        { href: '/dashboard/clients', label: 'Edificios', icon: Building },
        { href: '/dashboard/pricing', label: 'Inventario', icon: CreditCard },
        { href: '/dashboard/config', label: 'Configuración', icon: Settings },
    ]

    // Admin nav item
    if (user?.role === 'ADMIN') {
        navItems.push({ href: '/dashboard/admin', label: 'Admin', icon: Users })
    }

    const handleSignOut = async () => {
        // Try both logouts
        await signOut({ redirect: false })
        await logout() // This redirects to login
    }

    // Determine Display Title
    const displayTitle = user?.config?.fantasyName || user?.config?.businessName || 'Panel de Control'

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r border-zinc-800 bg-black text-white md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b border-zinc-800 px-4 lg:h-[60px] lg:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
                            <span className="">Elevar App</span>
                        </Link>
                    </div>
                    <div className="flex-1">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                            {navItems.map((item: any, index) => (
                                item.children ? (
                                    <Collapsible key={index} defaultOpen className="group/collapsible">
                                        <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:text-white hover:bg-zinc-900">
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-zinc-800 pl-3">
                                                {item.children.map((sub: any) => (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:text-white hover:bg-zinc-900"
                                                    >
                                                        {sub.icon && <sub.icon className="h-3 w-3" />}
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ) : (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:text-white hover:bg-zinc-900"
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                )
                            ))}
                        </nav>
                    </div>
                    <div className="mt-auto p-4">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-4 w-4" />
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <Link
                                    href="#"
                                    className="flex items-center gap-2 text-lg font-semibold"
                                >
                                    <span className="sr-only">Elevar App</span>
                                </Link>
                                {navItems.map((item: any, index: number) => (
                                    item.children ? (
                                        <div key={index} className="flex flex-col gap-2">
                                            <div className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground">
                                                <item.icon className="h-5 w-5" />
                                                {item.label}
                                            </div>
                                            <div className="ml-10 flex flex-col gap-2">
                                                {item.children.map((sub: any) => (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        {sub.icon && <sub.icon className="h-4 w-4" />}
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                        </Link>
                                    )
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        <h1 className="text-lg font-semibold md:text-xl">{displayTitle}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium hidden md:block">
                            {user?.email || 'Usuario'}
                        </span>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}

