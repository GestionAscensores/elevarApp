'use client'

import { useState, useEffect } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getEquipmentVisits } from '@/actions/maintenance'
import { Loader2, History, MapPin, FileText, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface EquipmentHistorySheetProps {
    equipmentId: string
    equipmentName: string
    clientName: string
}

export function EquipmentHistorySheet({ equipmentId, equipmentName, clientName }: EquipmentHistorySheetProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [visits, setVisits] = useState<any[]>([])

    useEffect(() => {
        if (open) {
            setLoading(true)
            getEquipmentVisits(equipmentId)
                .then(data => setVisits(data))
                .finally(() => setLoading(false))
        }
    }, [open, equipmentId])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" title="Ver Historial">
                    <History className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historial de Mantenimiento
                    </SheetTitle>
                    <SheetDescription>
                        {equipmentName} - {clientName}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : visits.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No hay visitas registradas para este equipo.
                        </div>
                    ) : (
                        <div className="space-y-6 pt-6 relative border-l ml-4 border-muted">
                            {visits.map((visit, index) => (
                                <div key={visit.id} className="relative pl-6 pb-2">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${visit.status === 'Completada' ? 'bg-green-500' : 'bg-gray-300'}`} />

                                    <div className="flex flex-col gap-1 mb-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">
                                                {new Date(visit.date).toLocaleDateString()}
                                            </span>
                                            <Badge variant="outline" className="text-[10px]">
                                                {visit.type}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <ClockIcon className="h-3 w-3" />
                                            {new Date(visit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                                        </span>
                                    </div>

                                    {/* Technician Info */}
                                    <div className="flex items-center gap-2 mt-2 bg-muted/30 p-2 rounded-md">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={visit.technician?.avatarUrl} />
                                            <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{visit.technician?.name || 'Técnico'}</span>
                                    </div>

                                    {/* Notes */}
                                    {(visit.publicNotes || visit.privateNotes) && (
                                        <div className="mt-3 space-y-2 text-sm bg-gray-50 p-3 rounded-lg border">
                                            {visit.publicNotes && (
                                                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                                                    <p className="font-semibold text-xs text-blue-600 mb-1 flex items-center gap-1">
                                                        <FileText className="h-3 w-3" /> Reporte Público
                                                    </p>
                                                    <p className="text-gray-700">{visit.publicNotes}</p>
                                                </div>
                                            )}
                                            {visit.privateNotes && (
                                                <div className="bg-yellow-50/50 p-2 rounded border border-yellow-100">
                                                    <p className="font-semibold text-xs text-orange-600 mb-1 flex items-center gap-1">
                                                        <FileText className="h-3 w-3" /> Nota Interna
                                                    </p>
                                                    <p className="text-gray-600 italic">{visit.privateNotes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Location marker if present */}
                                    {visit.locationLat && (
                                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Ubicación registrada
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
