'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, MapPin, CheckCircle, AlertTriangle, History, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface PublicStatusProps {
    clientName: string
    status: string
    lastVisit: {
        date: Date
        technicianName: string
        technicianAvatar?: string | null
        publicNotes?: string | null
        locationLat?: number | null
        locationLng?: number | null
    } | null
    companyLogo?: string | null
    history?: {
        id: string
        date: Date
        technicianName: string
        technicianAvatar?: string | null
        publicNotes?: string | null
        status: string
    }[]
}

export function PublicStatus({ clientName, status, lastVisit, companyLogo, history = [] }: PublicStatusProps) {
    const [showHistory, setShowHistory] = useState(false)

    // Determine status color/icon
    const isOk = status === 'Completada' || status === 'En Servicio' || status === 'OPERATIVE'

    // Map URL
    const mapUrl = lastVisit?.locationLat && lastVisit?.locationLng
        ? `https://maps.google.com/maps?q=${lastVisit.locationLat},${lastVisit.locationLng}&z=15&output=embed`
        : null

    return (
        <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center">

            {/* 1. Header Logo (Full Width / Max 200px equivalent constraint if needed, but requested full width) */}
            {/* 1. Header Logo (Full Width) */}
            {companyLogo ? (
                <div className="w-full bg-white shadow-sm mb-4">
                    <div className="w-full h-32 relative">
                        {/* Removed max-w-md to allow full width banner effect as requested */}
                        <img
                            src={companyLogo}
                            alt="Company Logo"
                            className="w-full h-full object-contain p-2"
                        />
                    </div>
                </div>
            ) : (
                <div className="h-4 w-full"></div>
            )}

            <div className="w-full max-w-md px-4 space-y-6 pb-12">

                {/* ... existing code ... */}

                {/* History Toggle Button */}
                {history && history.length > 0 && (
                    <Button
                        variant="outline"
                        className="w-full mt-4 flex items-center justify-center gap-2"
                        onClick={() => {
                            console.log('Toggling history', !showHistory);
                            setShowHistory(!showHistory)
                        }}
                    >
                        <History className="h-4 w-4" />
                        {showHistory ? 'Ocultar Historial' : 'Ver Historial (v0.2.3)'}
                        {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                )}

                {/* 4. History List (Inside Card) */}
                {history && history.length > 0 && showHistory && (
                    <div className="pt-4 border-t mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Historial Reciente</h4>
                        {history.map((visit) => (
                            <div key={visit.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg border">
                                <div className="h-16 w-16 rounded-full bg-white border flex-shrink-0 overflow-hidden">
                                    {visit.technicianAvatar ? (
                                        <Image src={visit.technicianAvatar} alt={visit.technicianName} width={64} height={64} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-8 w-8 text-gray-400 m-auto" />
                                    )}
                                </div>
                                <div className="space-y-1 flex-1 flex flex-col justify-center">
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium text-sm">{visit.technicianName}</p>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(visit.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {visit.publicNotes && (
                                        <p className="text-xs text-gray-600 line-clamp-2 italic">"{visit.publicNotes}"</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
            </div >
        </div >
    )
}
