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
    const [editingVisit, setEditingVisit] = useState<any | null>(null)
    const [selectedVisits, setSelectedVisits] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            setLoading(true)
            getEquipmentVisits(equipmentId)
                .then(data => setVisits(data))
                .finally(() => setLoading(false))
        }
    }, [open, equipmentId])

    const handleDownloadPDF = async () => {
        const { jsPDF } = await import('jspdf')
        const { default: autoTable } = await import('jspdf-autotable')

        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.text(`Historial de Mantenimiento: ${equipmentName}`, 14, 20)
        doc.setFontSize(12)
        doc.text(`Cliente: ${clientName}`, 14, 30)

        const visitsToPrint = selectedVisits.length > 0
            ? visits.filter(v => selectedVisits.includes(v.id))
            : visits

        const tableData = visitsToPrint.map(v => [
            new Date(v.date).toLocaleDateString(),
            v.technician?.name || 'Técnico',
            v.type,
            v.publicNotes || '-',
            v.privateNotes || '-',
            v.status
        ])

        autoTable(doc, {
            startY: 40,
            head: [['Fecha', 'Técnico', 'Tipo', 'Nota Pública', 'Nota Interna', 'Estado']],
            body: tableData,
        })

        // Add photos in new pages if present
        for (const v of visitsToPrint) {
            if (v.proofUrl) {
                doc.addPage()
                doc.text(`Comprobante Visita ${new Date(v.date).toLocaleDateString()}`, 14, 20)
                try {
                    doc.addImage(v.proofUrl, 'JPEG', 15, 30, 180, 100) // Assuming usage fit
                } catch (e) {
                    doc.text("(Error al cargar imagen)", 15, 30)
                }
            }
        }

        doc.save(`Historial_${equipmentName}.pdf`)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" title="Ver Historial">
                    <History className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[640px]">
                <SheetHeader className="pb-4 border-b flex flex-row justify-between items-center">
                    <div>
                        <SheetTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Historial de Mantenimiento
                        </SheetTitle>
                        <SheetDescription>
                            {equipmentName} - {clientName}
                        </SheetDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={loading || visits.length === 0}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
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
                                <div key={visit.id} className="relative pl-6 pb-2 group">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${visit.status === 'Completada' ? 'bg-green-500' : 'bg-gray-300'}`} />

                                    <div className="flex flex-col gap-1 mb-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">
                                                {new Date(visit.date).toLocaleDateString()}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {visit.type}
                                                </Badge>
                                                {/* Admin Edit Trigger (Add Logic for Admin Check later, for now visible) */}
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" title="Editar Visita" onClick={() => setEditingVisit(visit)}>
                                                    <span className="sr-only">Editar</span>
                                                    <EditIcon className="h-3 w-3" />
                                                </Button>
                                            </div>
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

                                    {/* Photo Proof Display */}
                                    {visit.proofUrl && (
                                        <div className="mt-2">
                                            <img src={visit.proofUrl} alt="Comprobante" className="rounded-md border h-16 w-auto object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(visit.proofUrl, '_blank')} />
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

                {/* Minimal Edit Dialog (Can be extracted) */}
                {editingVisit && (
                    <EditVisitDialog
                        visit={editingVisit}
                        open={!!editingVisit}
                        onClose={() => setEditingVisit(null)}
                        onSuccess={() => {
                            setEditingVisit(null)
                            // Refetch
                            setLoading(true)
                            getEquipmentVisits(equipmentId).then(setVisits).finally(() => setLoading(false))
                        }}
                    />
                )}
            </SheetContent>
        </Sheet>
    )
}

function EditVisitDialog({ visit, open, onClose, onSuccess }: { visit: any, open: boolean, onClose: () => void, onSuccess: () => void }) {
    const [publicNotes, setPublicNotes] = useState(visit.publicNotes || '')
    const [privateNotes, setPrivateNotes] = useState(visit.privateNotes || '')
    const [loading, setLoading] = useState(false)
    const { updateMaintenanceVisit } = require('@/actions/maintenance') // Lazy import to avoid circular dep issues in client component if any

    async function handleSave() {
        setLoading(true)
        const res = await updateMaintenanceVisit(visit.id, { publicNotes, privateNotes })
        setLoading(false)
        if (res.success) {
            onSuccess()
        } else {
            alert("Error al actualizar")
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 animate-in zoom-in-95">
                <h3 className="font-bold text-lg">Editar Visita</h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Nota Pública</label>
                    <textarea className="w-full border rounded p-2 text-sm" rows={3} value={publicNotes} onChange={e => setPublicNotes(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Nota Interna</label>
                    <textarea className="w-full border rounded p-2 text-sm bg-yellow-50" rows={3} value={privateNotes} onChange={e => setPrivateNotes(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </div>
            </div>
        </div>
    )
}

function EditIcon({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
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
