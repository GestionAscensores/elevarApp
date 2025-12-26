// Imports updated
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { registerVisit } from '@/actions/maintenance'
import { createTask } from '@/actions/tasks'
import { toast } from 'sonner'
import { MapPin, Camera, Loader2, Send, AlertTriangle, X, CheckSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface VisitFormProps {
    clientId: string
    technicianId: string
    technicianName: string
    onSuccess: () => void
    onCancel: () => void
    equipmentId?: string
}

const PRESET_PHRASES = [
    "Tareas de mantenimiento realizadas, todo normal al día de la fecha.",
    "Tareas de mantenimiento realizadas - Apto para uso, con preventivas pendientes.",
    "Se recomienda realizar las reparaciones informadas con la mayor brevedad posible."
]

export function VisitForm({ clientId, technicianId, technicianName, onSuccess, onCancel, equipmentId }: VisitFormProps) {
    const [loading, setLoading] = useState(false)
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [geoError, setGeoError] = useState<string | null>(null)
    const [proof, setProof] = useState<string | null>(null)
    const [addTask, setAddTask] = useState(false)
    const [outOfService, setOutOfService] = useState(false)
    const [publicNote, setPublicNote] = useState("") // Controlled state
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProof(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)

        // Use controlled publicNote
        const privateNotes = formData.get('privateNotes') as string

        // 1. Register Visit
        const res = await registerVisit({
            clientId,
            technicianId,
            type: 'Rutina',
            publicNotes: publicNote,
            privateNotes,
            locationLat: location?.lat,
            locationLng: location?.lng,
            proofUrl: proof || undefined,
            equipmentId,
            equipmentStatus: outOfService ? 'STOPPED' : 'OPERATIVE'
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
            toast.success("Remito Digital registrado con éxito")
            onSuccess()
        }
        setLoading(false)
    }

    return (
        <Card className="w-full max-w-md mx-auto mt-4 border-2 border-primary/20 shadow-xl">
            <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex justify-between items-center">
                    <span>Remito Digital</span>
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
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="publicNotes">Mensaje para el Consorcio {outOfService && <span className="text-xs font-normal text-muted-foreground">(Opcional si está fuera de servicio)</span>}</Label>

                        </div>

                        {/* Preset Phrases */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            <Select onValueChange={(val) => setPublicNote(val)}>
                                <SelectTrigger className="h-8 text-xs bg-blue-50 border-blue-200 text-blue-800 w-full">
                                    <SelectValue placeholder="✨ Frases Rápidas..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRESET_PHRASES.map((phrase, i) => (
                                        <SelectItem key={i} value={phrase} className="text-xs">
                                            {phrase.substring(0, 50)}...
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Textarea
                            id="publicNotes"
                            name="publicNotes"
                            value={publicNote}
                            onChange={(e) => setPublicNote(e.target.value)}
                            placeholder="Ej: Service mensual realizado. Todo en orden."
                            className="resize-none"
                            required={!outOfService} // Optional if out of service
                        />
                    </div>

                    {/* Out of Service Toggle */}
                    {equipmentId && (
                        <div className={`border rounded-lg p-4 space-y-4 transition-colors ${outOfService ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className={`h-5 w-5 ${outOfService ? 'text-red-600' : 'text-gray-400'}`} />
                                    <div className="space-y-0.5">
                                        <Label className={`text-base font-semibold cursor-pointer ${outOfService ? 'text-red-900' : 'text-gray-700'}`} onClick={() => setOutOfService(!outOfService)}>
                                            Fuera de Servicio
                                        </Label>
                                        <p className={`text-xs ${outOfService ? 'text-red-700' : 'text-gray-500'}`}>
                                            Marcar equipo como detenido
                                        </p>
                                    </div>
                                </div>
                                <Switch checked={outOfService} onCheckedChange={setOutOfService} className="data-[state=checked]:bg-red-600" />
                            </div>
                        </div>
                    )}

                    {/* Pending Task Section (Renamed) */}
                    <div className="border rounded-lg p-4 bg-orange-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-orange-600" />
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold text-orange-900 cursor-pointer" onClick={() => setAddTask(!addTask)}>Agregar tareas pendientes</Label>
                                    <p className="text-xs text-orange-700">Registrar reparación necesaria</p>
                                </div>
                            </div>
                            <Switch checked={addTask} onCheckedChange={setAddTask} />
                        </div>

                        {addTask && (
                            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label htmlFor="taskDescription">Descripción del Trabajo Pendiente</Label>
                                    <Textarea
                                        id="taskDescription"
                                        name="taskDescription"
                                        placeholder="Ej: Necesita reemplazo cinta de frenos..."
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

                    {/* Proof Upload (Camera) */}
                    <div className="space-y-2">
                        <Label>Comprobante / Foto (Opcional)</Label>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        {proof ? (
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video bg-black/5">
                                <img src={proof} alt="Proof" className="w-full h-full object-contain" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                    onClick={() => {
                                        setProof(null)
                                        if (fileInputRef.current) fileInputRef.current.value = ''
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="h-8 w-8 mb-2 text-blue-500" />
                                <span className="text-sm font-medium text-blue-600">Tomar Foto</span>
                                <span className="text-xs text-muted-foreground mt-1">Se adjuntará al remito</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading || !location}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar Remito
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
