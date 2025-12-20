'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

const features = [
    'Facturación Electrónica Ilimitada',
    'Usuarios Ilimitados',
    'Clientes y Edificios Ilimitados',
    'Actualización Masiva de Precios',
    'Soporte Técnico Prioritario',
    'Actualizaciones Gratuitas',
    'Copia de Seguridad Automática',
]

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px]"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                        Un precio simple y transparente
                    </h2>
                    <p className="text-lg text-slate-400">
                        Sin costos ocultos ni comisiones por factura. Empieza gratis y paga solo si te funciona.
                    </p>
                </div>

                <div className="max-w-lg mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 md:p-12 hover:border-blue-500/50 transition-colors shadow-2xl relative overflow-hidden">
                    <div className="absolute top-5 right-5 bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20">
                        OFERTA LANZAMIENTO
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-semibold">Plan Profesional</h3>
                            <p className="text-slate-400 mt-1">Todo incluido</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500 line-through font-medium mb-1">$25.000</div>
                            <div className="text-4xl font-bold text-white">$15.000</div>
                            <div className="text-slate-400 text-sm">/mes + IVA</div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-700 mb-8"></div>

                    <ul className="space-y-4 mb-10">
                        {features.map((feature) => (
                            <li key={feature} className="flex items-center gap-3">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-blue-400" />
                                </div>
                                <span className="text-slate-200">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <Button asChild size="lg" className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
                        <Link href="/register">
                            Aprovechar Oferta Lanzamiento
                        </Link>
                    </Button>

                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                        <p className="text-sm text-slate-400 mb-2">
                            ¿Manejas múltiples razones sociales o Monotributos?
                        </p>
                        <Link href="/contact" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                            Contáctanos para un Plan Corporativo a medida
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
