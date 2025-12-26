
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteClients, toggleClientStatus } from '@/actions/clients'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Power } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ClientSearch } from '@/components/clients/client-search'
import { ClientActions } from '@/components/clients/client-actions'
import { ClientPriceCell } from '@/components/clients/client-price-cell'
import { ClientNameCell } from '@/components/clients/client-name-cell'
import { ClientNumberCell } from '@/components/clients/client-number-cell'
import { ClientAddressCell } from '@/components/clients/client-address-cell'
import { ClientFrequencyCell } from '@/components/clients/client-frequency-cell'
import { toast } from 'sonner'

interface ClientListProps {
    initialClients: any[]
}

export function ClientList({ initialClients }: ClientListProps) {
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active')
    const [selectedClients, setSelectedClients] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const filteredClients = initialClients.filter(client => {
        if (filterStatus === 'all') return true
        if (filterStatus === 'active') return client.isActive
        if (filterStatus === 'inactive') return !client.isActive
        return true
    })

    // Toggle all logic
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedClients(filteredClients.map((c) => c.id))
        } else {
            setSelectedClients([])
        }
    }

    // Toggle single logic
    const handleSelectOne = (checked: boolean, id: string) => {
        if (checked) {
            setSelectedClients((prev) => [...prev, id])
        } else {
            setSelectedClients((prev) => prev.filter((clientId) => clientId !== id))
        }
    }

    const handleBulkDelete = () => {
        if (selectedClients.length === 0) return
        if (!confirm(`¿Estás seguro de eliminar ${selectedClients.length} clientes?`)) return

        startTransition(async () => {
            const result = await deleteClients(selectedClients)
            if (result.success) {
                toast.success(`${selectedClients.length} clientes eliminados`)
                setSelectedClients([])
                router.refresh()
            } else {
                toast.error(result.message || 'Error al eliminar')
            }
        })
    }

    const handleBulkStatusChange = (isActive: boolean) => {
        if (selectedClients.length === 0) return
        const actionName = isActive ? "activar" : "suspender"
        if (!confirm(`¿Estás seguro de ${actionName} ${selectedClients.length} clientes?`)) return

        startTransition(async () => {
            const result = await toggleClientStatus(selectedClients, isActive)
            if (result.success) {
                toast.success(`Clientes ${isActive ? 'activados' : 'suspendidos'} correctamente`)
                setSelectedClients([]) // Clear selection as they might disappear from view
                router.refresh()
            } else {
                toast.error(result.message || `Error al ${actionName}`)
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Listado de Clientes</CardTitle>
                        <CardDescription>Administra los edificios y consorcios.</CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedClients.length > 0 ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkStatusChange(false)}
                                    disabled={isPending}
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                                >
                                    <Power className="mr-2 h-4 w-4" />
                                    Suspender ({selectedClients.length})
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkStatusChange(true)}
                                    disabled={isPending}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                >
                                    <Power className="mr-2 h-4 w-4" />
                                    Activar ({selectedClients.length})
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    disabled={isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </Button>
                            </div>
                        ) : (
                            /* Status Filter Tabs */
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setFilterStatus('active')}
                                    className={`px-3 py-1 text-sm rounded-md transition-all ${filterStatus === 'active' ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Activos
                                </button>
                                <button
                                    onClick={() => setFilterStatus('inactive')}
                                    className={`px-3 py-1 text-sm rounded-md transition-all ${filterStatus === 'inactive' ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Inactivos
                                </button>
                                <button
                                    onClick={() => setFilterStatus('all')}
                                    className={`px-3 py-1 text-sm rounded-md transition-all ${filterStatus === 'all' ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Todos
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center gap-2">
                    <ClientSearch />
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filteredClients.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/20">
                            No hay clientes {filterStatus === 'active' ? 'activos' : filterStatus === 'inactive' ? 'inactivos' : ''} registrados.
                        </div>
                    ) : (
                        filteredClients.map((client: any) => {
                            const totalAbono = client.items?.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0) || 0;
                            const isSelected = selectedClients.includes(client.id)
                            return (
                                <Card key={client.id} className={isSelected ? 'ring-2 ring-primary border-primary' : ''}>
                                    <CardHeader className="p-4 pb-2 flex flex-row items-start gap-3 space-y-0">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => handleSelectOne(checked as boolean, client.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="font-bold text-base truncate pr-2">
                                                    {client.name}
                                                    <span className="ml-2 text-xs font-normal text-muted-foreground">#{client.clientNumber || '-'}</span>
                                                </div>
                                                {!client.isActive && (
                                                    <span className="shrink-0 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                                        Inactivo
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{client.address || 'Sin dirección'}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 py-2 text-sm grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Frecuencia</p>
                                            <p className="font-medium">
                                                {client.priceUpdateFrequency === 'MONTHLY' ? 'Mensual' :
                                                    client.priceUpdateFrequency === 'QUARTERLY' ? 'Trimestral' :
                                                        client.priceUpdateFrequency}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Total Abono</p>
                                            <p className="font-bold text-base">${totalAbono.toFixed(2)}</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-2 bg-muted/30 flex justify-end border-t">
                                        <ClientActions id={client.id} />
                                    </CardFooter>
                                </Card>
                            )
                        })
                    )}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={filteredClients.length > 0 && selectedClients.length === filteredClients.length}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="w-[80px]">N°</TableHead>
                                <TableHead>Edificio / Nombre</TableHead>
                                <TableHead>Dirección</TableHead>
                                <TableHead>Frecuencia de Actualización</TableHead>
                                <TableHead>Abono</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No hay clientes {filterStatus === 'active' ? 'activos' : filterStatus === 'inactive' ? 'inactivos' : ''} registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map((client: any) => {
                                    const totalAbono = client.items?.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0) || 0;
                                    const isSelected = selectedClients.includes(client.id)
                                    return (
                                        <TableRow key={client.id} data-state={isSelected ? "selected" : undefined} className={!client.isActive ? "bg-slate-50 opacity-75" : ""}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleSelectOne(checked as boolean, client.id)}
                                                    aria-label={`Select ${client.name}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <ClientNumberCell clientId={client.id} initialNumber={client.clientNumber} />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <ClientNameCell clientId={client.id} initialName={client.name} />
                                                    {!client.isActive && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Inactivo</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <ClientAddressCell clientId={client.id} initialAddress={client.address} />
                                            </TableCell>
                                            <TableCell>
                                                <ClientFrequencyCell clientId={client.id} initialFrequency={client.priceUpdateFrequency || 'MONTHLY'} />
                                            </TableCell>
                                            <TableCell>
                                                <ClientPriceCell clientId={client.id} initialPrice={totalAbono} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ClientActions id={client.id} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card >
    )
}
