'use client'

import { Zap, Users, BarChart3, Receipt, FileText, ShieldCheck, Send, TrendingUp } from 'lucide-react'

const features = [
    {
        name: 'Facturación Masiva Automática',
        description: 'Genera y autoriza en AFIP cientos de facturas de abonos en un solo clic. Lo que antes llevaba días, ahora toma segundos.',
        icon: Zap,
    },
    {
        name: 'Control de Categorías Monotributo',
        description: 'No te pases del límite. Nuestro semáforo fiscal te avisa cuánto puedes facturar antes de saltar de categoría o quedar excluido.',
        icon: BarChart3,
    },
    {
        name: 'Envío Automático de Correos',
        description: 'El sistema envía las facturas a tus clientes (y administradores) automáticamente. Ahorra horas de adjuntar PDFs y escribir emails uno por uno.',
        icon: Send,
    },
    {
        name: 'Gestión de Equipos Inmuebles',
        description: 'Lleva el control de cada ascensor vinculado a su dirección exacta. Organiza tu cartera de clientes por edificio y unidad funcional.',
        icon: FileText,
    },
    {
        name: 'Aumentos de Precio Masivos',
        description: '¿Inflación? Actualiza el precio de todos tus abonos en un porcentaje fijo con una sola acción. Mantén tu rentabilidad al día.',
        icon: TrendingUp,
    },
    {
        name: 'Hecho a tu Medida',
        description: 'Por fin un software que habla tu idioma. Diseñado exclusivamente para empresas de mantenimiento, entendiendo tus problemas reales.',
        icon: ShieldCheck,
    },
]

export function Features() {
    return (
        <section id="features" className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
                        Todo lo que necesitas para administrar tu empresa
                    </h2>
                    <p className="text-lg text-slate-600">
                        Elevar App reemplaza planillas, carpetas y sistemas contables genéricos con una solución hecha a medida para el gremio.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature) => (
                        <div key={feature.name} className="relative group p-8 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100">
                            <div className="absolute top-8 right-8 text-slate-200 group-hover:text-blue-50 transition-colors">
                                <feature.icon className="h-24 w-24 opacity-20" />
                            </div>

                            <div className="relative">
                                <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    <feature.icon className="h-6 w-6" />
                                </div>

                                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                                    {feature.name}
                                </h3>

                                <p className="text-slate-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
