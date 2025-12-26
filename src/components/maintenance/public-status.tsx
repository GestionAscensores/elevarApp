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
            {companyLogo ? (
                <div className="w-full bg-white shadow-sm mb-4">
                    <div className="max-w-md mx-auto h-32 relative">
                        {/* We use object-contain to ensure the whole logo is visible without cropping, 
                            centered in the area. User said "occupy all width", potentially meaning 
                            a banner. We'll try object-contain with a white background for cleanliness. */}
                        <img
                            src={companyLogo}
                            alt="Company Logo"
                            className="w-full h-full object-contain p-4"
                        />
                    </div>
                </div>
            ) : (
                <div className="h-4 w-full"></div>
            )}

            <div className="w-full max-w-md px-4 space-y-6 pb-12">

                {/* 2. Status Card */}
                <div className={`p-6 rounded-3xl text-center shadow-md transform transition-all ${isOk ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-red-500 to-red-600 text-white'}`}>
                    <div className="flex justify-center mb-4">
                        {isOk ? <CheckCircle className="h-16 w-16 opacity-90" /> : <AlertTriangle className="h-16 w-16 opacity-90" />}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        {isOk ? 'EN SERVICIO' : 'FUERA DE SERVICIO'}
                    </h1>
                    <p className="text-white/80 font-medium text-lg">{clientName}</p>
                </div>

                {/* 3. Last Visit Details (Map & Tech) - Only if we have data */}
                {lastVisit && (
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Última Visita
                            </CardTitle>
                            <p className="text-sm text-muted-foreground ml-7">
                                {new Date(lastVisit.date).toLocaleDateString('es-AR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Technician Info */}
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                                    {lastVisit.technicianAvatar ? (
                                        <Image src={lastVisit.technicianAvatar} alt={lastVisit.technicianName} width={48} height={48} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-6 w-6 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Técnico a cargo</p>
                                    <p className="font-bold text-lg">{lastVisit.technicianName}</p>
                                </div>
                            </div>

                            {/* Public Note */}
                            {lastVisit.publicNotes && (
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-blue-900 italic">"{lastVisit.publicNotes}"</p>
                                </div>
                            )}

                            {/* Map proof */}
                            {mapUrl && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        Ubicación del reporte
                                    </div>
                                    <div className="rounded-xl overflow-hidden border shadow-sm aspect-video relative bg-slate-100">
                                        <iframe
                                            src={mapUrl}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            allowFullScreen
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* History Toggle Button */}
                            {history && history.length > 0 && (
                                <Button
                                    variant="outline"
                                    className="w-full mt-4 flex items-center justify-center gap-2"
                                    onClick={() => setShowHistory(!showHistory)}
                                >
                                    <History className="h-4 w-4" />
                                    {showHistory ? 'Ocultar Historial' : 'Ver Historial de Visitas (Click aquí)'}
                                    {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Debug Marker (remove later) */}
                {/* <div className="text-xs text-gray-300 text-center">v0.1.9 - Cached: {new Date().toISOString()}</div> */}

                {/* 4. History (Past 5 Visits) - Collapsible */}
                {history && history.length > 0 && showHistory && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
                        {history.map((visit) => (
                            <Card key={visit.id} className="border shadow-sm">
                                <CardContent className="p-4 flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                                        {visit.technicianAvatar ? (
                                            <Image src={visit.technicianAvatar} alt={visit.technicianName} width={40} height={40} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5 text-gray-400 m-auto" />
                                        )}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-sm">{visit.technicianName}</p>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(visit.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {visit.publicNotes && (
                                            <p className="text-sm text-gray-600 line-clamp-2">"{visit.publicNotes}"</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
