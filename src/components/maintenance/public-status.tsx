'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, MapPin, CheckCircle, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

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
}

export function PublicStatus({ clientName, status, lastVisit }: PublicStatusProps) {
    // Determine status color/icon
    const isOk = status === 'Completada' || status === 'En Servicio'
    // Default to OK if we just have visits. Real logic requires explicit status field on Client or Last Visit Type check.
    // For this MVP, we assume if last visit exists, it's info.

    // Map URL
    const mapUrl = lastVisit?.locationLat && lastVisit?.locationLng
        ? `https://maps.google.com/maps?q=${lastVisit.locationLat},${lastVisit.locationLng}&z=15&output=embed`
        : null

    return (
        <div className="space-y-6 w-full max-w-md mx-auto">
            {/* Header Status */}
            <div className={`p-6 rounded-3xl text-center shadow-lg transform transition-all hover:scale-105 ${isOk ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white'}`}>
                <div className="flex justify-center mb-4">
                    {isOk ? <CheckCircle className="h-16 w-16 opacity-90" /> : <AlertTriangle className="h-16 w-16 opacity-90" />}
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    {isOk ? 'EN SERVICIO' : 'EN MANTENIMIENTO'}
                </h1>
                <p className="text-white/80 font-medium text-lg">{clientName}</p>
            </div>

            {/* Last Visit Card */}
            {lastVisit ? (
                <Card className="border-0 shadow-md overflow-hidden">
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
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                                {lastVisit.technicianAvatar ? (
                                    <Image src={lastVisit.technicianAvatar} alt={lastVisit.technicianName} width={48} height={48} className="rounded-full" />
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
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No hay registros recientes de mantenimiento en el sistema.
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
