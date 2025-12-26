'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { registerVisit } from '@/actions/maintenance'
import { toast } from 'sonner'
import { MapPin, Camera, Loader2, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VisitFormProps {
    clientId: string
    technicianId: string
    technicianName: string
    onSuccess: () => void
    onCancel: () => void
    equipmentId?: string
}

export function VisitForm({ clientId, technicianId, technicianName, onSuccess, onCancel, equipmentId }: VisitFormProps) {
    const [loading, setLoading] = useState(false)
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [geoError, setGeoError] = useState<string | null>(null)
    const [proof, setProof] = useState<string | null>(null) // For now just a placeholder string or handle file upload later if implementing storage

    // Mock file upload - in real app would upload to S3/Blob and get URL
    // For MVP we might just store a base64 string or skip storage if not configured
    // I will skip actual file upload logic for now and just simulate it or focused on Geo + Notes
    // If user wants "Proof", I'll add a file input but maybe just store the name or simple base64 if small.
    // Given the constraints and no storage bucket setup mentioned, I'll focus on Geo + Notes as primary proof.

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    })
                },
                (err) => {
                    setGeoError('No se pudo obtener ubicación. Asegúrese de permitir el acceso.')
                },
                { enableHighAccuracy: true }
            )
        } else {
            setGeoError('Geolocalización no soportada.')
        }
    }, [])

    async function handleSubmit(formData: FormData) {
        setLoading(true)

        const publicNotes = formData.get('publicNotes') as string
        const privateNotes = formData.get('privateNotes') as string
        // const file = formData.get('proof') as File 

        // In a real scenario, we upload `file` to blob storage here and get `proofUrl`.
        // For this MVP, we will assume proofUrl is empty or just a placeholder if file selected.
        const proofUrl = proof ? "Simulated Upload" : undefined

        const res = await registerVisit({
            clientId,
            technicianId,
            type: 'Rutina', // Default for now, could add selector
            publicNotes,
            privateNotes,
            locationLat: location?.lat,
            locationLng: location?.lng,
            proofUrl,
            equipmentId
        })

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Visita registrada con éxito")
            onSuccess()
        }
        setLoading(false)
    }

    return (
        <Card className="w-full max-w-md mx-auto mt-4 border-2 border-primary/20 shadow-xl">
            <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex justify-between items-center">
                    <span>Nueva Visita</span>
                    <span className="text-sm font-normal text-muted-foreground">{technicianName}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form action={handleSubmit} className="space-y-6">
                    {/* Location Status */}
                    <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted/50">
                        <MapPin className={`h-4 w-4 ${location ? 'text-green-600' : 'text-orange-500'}`} />
                        {location ? (
                            <span className="text-green-700 font-medium">Ubicación capturada</span>
                        ) : (
                            <span className="text-orange-700">{geoError || 'Obteniendo ubicación...'}</span>
                        )}
                        {location && (
                            <input type="hidden" name="lat" value={location.lat} />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="publicNotes">Mensaje para el Consorcio (Público)</Label>
                        <Textarea
                            id="publicNotes"
                            name="publicNotes"
                            placeholder="Ej: Service mensual realizado. Todo en orden."
                            className="resize-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="privateNotes">Notas Internas (Privado)</Label>
                        <Textarea
                            id="privateNotes"
                            name="privateNotes"
                            placeholder="Detalles técnicos, repuestos necesarios..."
                            className="bg-yellow-50/50 resize-none"
                        />
                    </div>

                    {/* Proof Upload Placeholder */}
                    <div className="space-y-2">
                        <Label>Comprobante (Opcional)</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => toast.info("Carga de imágenes próximamente disponible")}>
                            <Camera className="h-8 w-8 mb-2 opacity-50" />
                            <span className="text-xs">Tomar foto / Subir remito</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading || !location}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Registrar
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
