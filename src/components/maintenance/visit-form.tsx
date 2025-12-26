// Imports updated
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { registerVisit } from '@/actions/maintenance'
import { createTask } from '@/actions/tasks'
import { toast } from 'sonner'
import { MapPin, Camera, Loader2, Send, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
    const [proof, setProof] = useState<string | null>(null)
    const [addTask, setAddTask] = useState(false)

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
        const proofUrl = proof ? "Simulated Upload" : undefined

        // 1. Register Visit
        const res = await registerVisit({
            clientId,
            technicianId,
            type: 'Rutina',
            publicNotes,
            privateNotes,
            locationLat: location?.lat,
            locationLng: location?.lng,
            proofUrl,
            equipmentId
        })

        // 2. Register Task if checked
        if (addTask && !res.error) {
            const taskDesc = formData.get('taskDescription') as string
            const taskPriority = formData.get('taskPriority') as string

            if (taskDesc) {
                await createTask({
                    clientId,
                    equipmentId,
                    description: taskDesc,
                    priority: taskPriority || 'NORMAL',
                    createdBy: technicianName
                })
                toast.info("Tarea pendiente registrada")
            }
        }

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

                    {/* Pending Task Section */}
                    <div className="border rounded-lg p-4 bg-orange-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold text-orange-900 cursor-pointer" onClick={() => setAddTask(!addTask)}>¿Detectó fallas?</Label>
                                    <p className="text-xs text-orange-700">Registrar tarea pendiente</p>
                                </div>
                            </div>
                            <Switch checked={addTask} onCheckedChange={setAddTask} />
                        </div>

                        {addTask && (
                            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label htmlFor="taskDescription">Descripción del Problema</Label>
                                    <Textarea
                                        id="taskDescription"
                                        name="taskDescription"
                                        placeholder="Ej: Ruido en cuarto de máquinas..."
                                        required={addTask}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taskPriority">Prioridad</Label>
                                    <Select name="taskPriority" defaultValue="NORMAL">
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NORMAL">Normal</SelectItem>
                                            <SelectItem value="URGENT">Urgente 🚨</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
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
