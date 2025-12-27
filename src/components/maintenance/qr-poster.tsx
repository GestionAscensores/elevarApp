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
                <h1 className="text-2xl font-bold">Vista Previa (Formato Oblea A6)</h1>
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir
                </Button>
            </div>

            {/* Poster Preview / Print Area - Custom "Phone" Size (approx 80mm x 160mm) */}
            <div id="print-area" className="bg-white text-black font-sans relative flex flex-col items-center overflow-hidden shadow-2xl print:shadow-none print:m-0"
                style={{
                    width: '82mm', // Close to iPhone 16 Pro Max width (77.6mm) + margins
                    height: '140mm', // Condensed vertical height as requested
                    padding: '5mm',
                    border: '1px solid #e5e7eb'
                }}>

                {/* Cut Guide Border */}
                <div className="absolute inset-0 border border-dashed border-gray-400 pointer-events-none print:border-gray-300" style={{ margin: '0' }}></div>

                {/* Header: JUST Fantasy Name */}
                <div className="w-full flex items-center justify-center pt-4 pb-2">
                    <h1 className="text-xl font-black uppercase tracking-tighter text-center leading-none">
                        {fantasyName || 'SERVICIO TÉCNICO'}
                    </h1>
                </div>

                {/* FULL WIDTH QR Code Section */}
                <div className="flex-1 w-full flex flex-col items-center justify-center my-0">
                    <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-[72mm] h-[72mm] rendering-pixelated" // Max width safe for 82mm container
                    />
                    <div className="w-full text-center mt-[-2mm]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Escanee para ver estado</p>
                    </div>
                </div>

                {/* Oblea / Data Section */}
                <div className="w-full flex flex-col items-center z-10 mt-0">

                    {/* Gray Band: "Oblea Nº" style */}
                    <div className="w-full bg-gray-200 py-1 text-center mb-1 print:bg-gray-100/50 print:border-y print:border-gray-300">
                        <h2 className="text-sm font-black uppercase tracking-wide">
                            {equipmentName || 'ASCENSOR'}
                        </h2>
                    </div>

                    {/* Address Block - Prominent */}
                    <div className="w-full text-center border-t border-gray-300 pt-2 pb-1">
                        <h3 className="text-[12px] font-black uppercase leading-tight mb-1">
                            {clientName}
                        </h3>
                        <p className="text-[10px] uppercase font-bold leading-tight text-gray-700">
                            {address}
                        </p>
                    </div>
                </div>

                {/* Footer: Custom Elevar App Branding */}
                <div className="w-full mt-auto pt-2 flex flex-col items-center justify-center opacity-90 gap-1">
                    <p className="text-[7px] font-bold uppercase text-gray-800 tracking-wide">
                        Sistema Digital de Gestión de Transporte Vertical
                    </p>
                    <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 text-black">
                            {/* Simple "Up/Down" icon logo */}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
                                <path d="M7 17l5 5 5-5M7 7l5-5 5 5" />
                            </svg>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-black">ELEVAR APP</span>
                    </div>
                    <p className="text-[6px] text-gray-500 font-medium">https://elevarapp.ar/</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
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
                        width: 82mm !important;
                        height: 140mm !important;
                        box-shadow: none;
                        margin: 0;
                        /* Keep dashed border for cutting */
                        border: 1px dashed #999 !important;
                        /* Optional: Force backgrounds if browser allows */
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    )
}
