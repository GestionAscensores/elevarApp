'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'

export function Navbar() {
    return (
        <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">Elevar App</span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <Link href="#features" className="hover:text-blue-600 transition-colors">Funcionalidades</Link>
                    <Link href="#pricing" className="hover:text-blue-600 transition-colors">Precios</Link>
                    <Link href="#faq" className="hover:text-blue-600 transition-colors">Preguntas</Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block">
                        Ingresar
                    </Link>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                        <Link href="/register">
                            Prueba Gratis
                        </Link>
                    </Button>
                </div>
            </div>
        </nav>
    )
}
