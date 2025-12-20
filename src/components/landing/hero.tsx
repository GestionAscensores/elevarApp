'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export function Hero() {
    return (
        <section className="relative pt-20 pb-32 overflow-hidden bg-slate-50">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Nuevo: Facturación Masiva con AFIP
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-tight">
                        Deja de pelear con <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Excel</span> y empieza a crecer.
                    </h1>

                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        La primera plataforma diseñada específicamente para empresas de <strong>mantenimiento de ascensores</strong>. Administra abonos, equipos y facturación en un solo lugar.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Button size="lg" asChild className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 w-full sm:w-auto">
                            <Link href="/register">
                                Comenzar Prueba Gratis <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg w-full sm:w-auto bg-white hover:bg-slate-50">
                            <Link href="/login">
                                Ya tengo cuenta
                            </Link>
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            Sin tarjeta de crédito
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            30 días de prueba
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            Configuración en 2 minutos
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Abstract Decoration - Optional */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl"></div>
        </section>
    )
}
