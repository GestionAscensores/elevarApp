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

            {/* Poster Preview / Print Area - A6 Size (105mm x 148mm) */}
            <div id="print-area" className="bg-white text-black font-sans relative flex flex-col items-center justify-between overflow-hidden shadow-2xl print:shadow-none print:m-0"
                style={{
                    width: '104mm', // Slightly less than 105 to ensure fit
                    height: '147mm', // Slightly less than 148
                    padding: '8mm',
                    border: '1px solid #e5e7eb' // Visible on screen, removed by print media if needed or kept as cut guide
                }}>

                {/* Cut Guide Border (Optional, helpful for cutting A4) */}
                <div className="absolute inset-0 border-2 border-dashed border-gray-300 pointer-events-none print:border-gray-200" style={{ margin: '1px' }}></div>

                {/* Header */}
                <div className="w-full flex flex-col items-center z-10 pt-2">
                    {/* Logo Area */}
                    <div className="h-12 w-full flex items-center justify-center mb-2">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-full object-contain max-w-[80%]" />
                        ) : (
                            <h3 className="text-lg font-black uppercase tracking-tighter text-center leading-none">
                                {fantasyName || 'SERVICIO TÉCNICO'}
                            </h3>
                        )}
                    </div>

                    {/* Title */}
                    <div className="text-center">
                        <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">
                            MANTENIMIENTO PREVENTIVO
                        </h2>
                    </div>
                </div>

                {/* Main QR Section */}
                <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
                    <div className="relative p-2 bg-white rounded-xl border-4 border-black shadow-sm">
                        <img
                            src={qrDataUrl}
                            alt="QR Code"
                            className="w-[50mm] h-[50mm] rendering-pixelated" // 5cm QR is substantial on A6
                        />
                        {/* Corner Accents */}
                        <div className="absolute top-[-2px] left-[-2px] w-4 h-4 border-t-4 border-l-4 border-black rounded-tl-lg"></div>
                        <div className="absolute top-[-2px] right-[-2px] w-4 h-4 border-t-4 border-r-4 border-black rounded-tr-lg"></div>
                        <div className="absolute bottom-[-2px] left-[-2px] w-4 h-4 border-b-4 border-l-4 border-black rounded-bl-lg"></div>
                        <div className="absolute bottom-[-2px] right-[-2px] w-4 h-4 border-b-4 border-r-4 border-black rounded-br-lg"></div>
                    </div>

                    <p className="mt-3 text-[10px] uppercase font-bold text-black flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse print:hidden"></span>
                        Estado Digital en Vivo
                    </p>
                </div>

                {/* Footer Info */}
                <div className="w-full text-center z-10 pb-1 space-y-1">
                    <h1 className="text-xl font-black leading-none uppercase truncate w-full px-2">
                        {equipmentName || 'ASCENSOR'}
                    </h1>
                    <p className="text-[9px] text-gray-600 line-clamp-2 px-4 leading-tight">
                        {address}
                    </p>

                    <div className="w-full h-px bg-gray-300 my-2"></div>

                    <p className="text-[8px] text-gray-400 font-medium uppercase tracking-wider">
                        Escanee para ver historial y reportes
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4; /* We let user put multiple or select paper */
                        margin: 10mm;
                    }
                    body {
                        visibility: hidden;
                        background: none;
                    }
                    #print-area {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        /* Force exact size */
                        width: 104mm !important;
                        height: 147mm !important;
                        box-shadow: none;
                        margin: 0;
                        border: 1px dashed #ccc !important; /* Keep light border as cutting guide */
                    }
                }
            `}</style>
        </div>
    )
}
