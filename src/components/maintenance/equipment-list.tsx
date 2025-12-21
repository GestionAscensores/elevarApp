'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, QrCode, PenSquare } from 'lucide-react'
import { deleteEquipment } from '@/actions/equipment'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CreateEquipmentDialog } from './create-equipment-dialog'

export function EquipmentList({ clientId, equipment }: { clientId: string, equipment: any[] }) {
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este equipo y su historial?')) return

        const res = await deleteEquipment(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Equipo eliminado')
            router.refresh()
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Bitácora de Equipos</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Gestiona los equipos y sus códigos QR para mantenimiento.
                    </p>
                </div>
                <CreateEquipmentDialog clientId={clientId} />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>QR ID</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {equipment.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No hay equipos registrados. Agrega uno para generar su QR.
                                </TableCell>
                            </TableRow>
                        ) : (
                            equipment.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div>{item.name}</div>
                                        {item.description && (
                                            <div className="text-xs text-muted-foreground">{item.description}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{item.type}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {item.qrCode}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                            Operativo
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" title="Ver QR">
                                                <QrCode className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} title="Eliminar">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
