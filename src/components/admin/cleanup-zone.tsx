'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { resetAccountData } from '@/actions/cleanup'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function CleanupZone() {
    const [open, setOpen] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [loading, setLoading] = useState(false)

    const handleReset = async () => {
        if (confirmText !== 'BORRAR') return
        setLoading(true)
        try {
            const res = await resetAccountData(confirmText)
            if (res.success) {
                toast.success(res.message)
                setOpen(false)
                setConfirmText('')
                window.location.reload() // Force full reload to clear any cached data
            } else {
                toast.error(res.error)
            }
        } catch (e) {
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10 mt-8">
            <CardHeader>
                <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    <CardTitle className="text-lg">Zona de Peligro</CardTitle>
                </div>
                <CardDescription className="text-red-600/80">
                    Acciones irreversibles para la gestión de datos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-white dark:bg-slate-950">
                    <div className="space-y-1">
                        <h4 className="font-medium text-sm">Reiniciar Facturación (Mis Datos)</h4>
                        <p className="text-xs text-muted-foreground">
                            Elimina <strong>todas</strong> las facturas y recibos de TU cuenta.
                            Mantiene clientes y productos.
                            <br />Use esto antes de pasar a Producción.
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Limpiar Base de Datos
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    ¿Estás absolutamente seguro?
                                </DialogTitle>
                                <DialogDescription className="space-y-3 pt-2">
                                    <p>Esta acción eliminará permanentemente todas las <strong>Facturas</strong> y <strong>Recibos</strong> emitidos por tu cuenta.</p>
                                    <p>Los Clientes y Productos NO se eliminarán.</p>
                                    <p className="font-bold text-black dark:text-white">Esta acción NO se puede deshacer.</p>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 py-4">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Escribe <strong>BORRAR</strong> para confirmar:
                                </label>
                                <Input
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="BORRAR"
                                    className="border-red-300 focus-visible:ring-red-500"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReset}
                                    disabled={confirmText !== 'BORRAR' || loading}
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Confirmar Reinicio
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    )
}
