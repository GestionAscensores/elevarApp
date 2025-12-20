'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-slate-50 border-t pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900">Elevar App</span>
                        </div>
                        <p className="text-slate-600 max-w-sm">
                            Plataforma integral para la gestión de empresas de mantenimiento de ascensores y transporte vertical.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Producto</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="#features" className="hover:text-blue-600">Funcionalidades</Link></li>
                            <li><Link href="#pricing" className="hover:text-blue-600">Precios</Link></li>
                            <li><Link href="/login" className="hover:text-blue-600">Ingresar</Link></li>
                            <li><Link href="/register" className="hover:text-blue-600">Registrarse</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="#" className="hover:text-blue-600">Términos y Condiciones</Link></li>
                            <li><Link href="#" className="hover:text-blue-600">Política de Privacidad</Link></li>
                            <li><Link href="#" className="hover:text-blue-600">Contacto</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Elevar App. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    )
}
