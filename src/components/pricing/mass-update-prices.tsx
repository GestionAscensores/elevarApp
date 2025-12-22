'use client'

import { useState } from 'react'
import { massUpdatePrices } from '@/actions/pricing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function MassUpdatePrices() {
    const [percentage, setPercentage] = useState(0)
    const [frequency, setFrequency] = useState('MONTHLY')
    const [showConfirm, setShowConfirm] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    const handleConfirmUpdate = async () => {
        setIsUpdating(true)
        try {
            const formData = new FormData()
            formData.append('percentage', percentage.toString())
            formData.append('frequency', frequency)

            const result = await massUpdatePrices(null, formData)

            if (result.success) {
                toast.success(result.message)
                setPercentage(0)
                setShowConfirm(false)
            } else {
                toast.error(result.message || 'Error al actualizar precios')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado al conectar con el servidor')
            console.error(error)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (percentage > 0) {
            setShowConfirm(true)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Actualización Masiva de Abonos
                </CardTitle>
                <CardDescription>
                    Actualiza los abonos de tus clientes aplicando un porcentaje de aumento
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="percentage">Porcentaje de Aumento (%)</Label>
                            <Input
                                id="percentage"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={percentage || ''}
                                onChange={(e) => setPercentage(Number(e.target.value))}
                                placeholder="Ej: 15"
                            />
                            <p className="text-xs text-muted-foreground">
                                Los precios se redondearán automáticamente (sin decimales)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="frequency">Filtros de Frecuencia</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger id="frequency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos (excepto bloqueados/inactivos)</SelectItem>
                                    <SelectItem value="MONTHLY">Solo Mensuales</SelectItem>
                                    <SelectItem value="QUARTERLY">Solo Trimestrales</SelectItem>
                                    <SelectItem value="SEMIANNUAL">Solo Semestrales</SelectItem>
                                    <SelectItem value="YEARLY">Solo Anuales</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Clientes marcados como "excluir" o "inactivos" no serán afectados
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            Esta acción afectará a todos los clientes que cumplan con los filtros seleccionados
                        </p>
                    </div>

                    <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                        <AlertDialogTrigger asChild>
                            <Button type="button" className="w-full" onClick={() => percentage > 0 && setShowConfirm(true)}>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Previsualizar Actualización
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Actualización Masiva de Abonos</AlertDialogTitle>
                                <AlertDialogDescription className="space-y-4 pt-4 text-base">
                                    <p>Estás por aplicar un aumento del <strong>{percentage}%</strong></p>

                                    <p>
                                        Solo los clientes marcados como <strong>
                                            {
                                                frequency === 'ALL' ? 'Todos (activos)' :
                                                    frequency === 'MONTHLY' ? 'MENSUAL' :
                                                        frequency === 'QUARTERLY' ? 'TRIMESTRAL' :
                                                            frequency === 'SEMIANNUAL' ? 'SEMESTRAL' : 'ANUAL'
                                            }
                                        </strong> serán afectados.
                                    </p>

                                    <p>¿Deseas continuar?</p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
                                <Button
                                    onClick={handleConfirmUpdate}
                                    disabled={isUpdating}
                                >
                                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar Actualización
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </form>
            </CardContent>
        </Card>
    )
}
