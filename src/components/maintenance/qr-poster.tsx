'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface QRPosterProps {
    clientName: string
    equipmentName?: string // New prop
    address: string
    qrDataUrl: string
    logoUrl?: string | null
    fantasyName?: string | null
}

export function QRPoster({ clientName, equipmentName, address, qrDataUrl, logoUrl, fantasyName }: QRPosterProps) {
    useEffect(() => {
        const originalTitle = document.title
        const printTitle = equipmentName
            ? `Qr (${clientName})-(${equipmentName})`
            : `Qr (${clientName})`

        document.title = printTitle

        return () => {
            document.title = originalTitle
        }
    }, [clientName, equipmentName])

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
            {/* Print Controls - Hidden when printing */}
            <div className="w-full max-w-2xl mb-8 flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-bold">Vista Previa del Cartel</h1>
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir
                </Button>
            </div>

            {/* Poster Preview */}
            <div className="bg-white shadow-xl print:shadow-none w-full max-w-[21cm] aspect-[21/29.7] p-12 flex flex-col items-center justify-between border print:border-none relative overflow-hidden">
                {/* Header */}
                <div className="w-full flex justify-between items-center border-b-4 border-black pb-6">
                    <div className="flex flex-col">
                        <h2 className="text-4xl font-black uppercase tracking-tighter">
                            Mantenimiento
                        </h2>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-blue-600">
                            Preventivo
                        </h2>
                    </div>
                    {logoUrl ? (
                        <div className="relative h-20 w-40">
                            <img src={logoUrl} alt="Logo" className="object-contain h-full w-full" />
                        </div>
                    ) : (
                        <h3 className="text-2xl font-bold">{fantasyName || 'ELEVAR APP'}</h3>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
                    <div className="text-center space-y-2">
                        <p className="text-xl text-gray-500 uppercase tracking-widest font-semibold">Consorcio</p>
                        <h1 className="text-3xl font-bold">{clientName}</h1>
                        <p className="text-2xl text-gray-800">{address}</p>
                    </div>

                    {equipmentName && (
                        <div className="bg-black text-white px-8 py-2 rounded-full">
                            <h2 className="text-2xl font-bold uppercase tracking-widest">{equipmentName}</h2>
                        </div>
                    )}

                    <div className="p-4 border-8 border-black rounded-3xl">
                        <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 md:w-96 md:h-96 rendering-pixelated" />
                    </div>

                    <div className="text-center max-w-md">
                        <p className="text-2xl font-bold text-center leading-tight">
                            Escanee este código para ver el estado del servicio y la última visita técnica.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="w-full border-t-2 border-gray-200 pt-6 text-center">
                    <p className="text-gray-400 text-sm">Sistema de Gestión de Mantenimiento - Proveedor Autorizado</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: A4 portrait;
                    }
                    body {
                        background: white;
                    }
                }
            `}</style>
        </div>
    )
}
