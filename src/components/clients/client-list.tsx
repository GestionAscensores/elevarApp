
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteClients } from '@/actions/clients'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ClientSearch } from '@/components/clients/client-search'
import { ClientActions } from '@/components/clients/client-actions'
import { ClientPriceCell } from '@/components/clients/client-price-cell'
import { ClientNameCell } from '@/components/clients/client-name-cell'
import { ClientAddressCell } from '@/components/clients/client-address-cell'
import { toast } from 'sonner'

interface ClientListProps {
    initialClients: any[]
}

export function ClientList({ initialClients }: ClientListProps) {
    const [selectedClients, setSelectedClients] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Toggle all logic
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedClients(initialClients.map((c) => c.id))
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

    // Transform simple properties to avoid Decimal passing issues if any,
    // though getClients usually returns plain objects from Prisma if not strictly typed with Decimal.js directly being passed.
    // However, Prisma default return includes Decimal objects for Decimal fields.
    // Client components cannot accept objects with methods (like Decimal).
    // The parent server component should normalize this, but we can't easily change getClients return type everywhere without breakage.
    // Best way: map data in the Server Component before passing here. 
    // BUT since we are in a refactor step, let's just receive the list and trust the parent transforms it.

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Listado de Clientes</CardTitle>
                        <CardDescription>Administra los edificios y consorcios.</CardDescription>
                    </div>
                    {selectedClients.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isPending}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar ({selectedClients.length})
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center gap-2">
                    <ClientSearch />
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={initialClients.length > 0 && selectedClients.length === initialClients.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Edificio / Nombre</TableHead>
                            <TableHead>CUIT</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Abono</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hay clientes registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialClients.map((client: any) => {
                                // Calculate totalAbono here or assume it's passed pre-calculated if needed.
                                // For now, we calculate it here based on items.
                                const totalAbono = client.items?.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0) || 0;
                                const isSelected = selectedClients.includes(client.id)
                                return (
                                    <TableRow key={client.id} data-state={isSelected ? "selected" : undefined}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => handleSelectOne(checked as boolean, client.id)}
                                                aria-label={`Select ${client.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <ClientNameCell clientId={client.id} initialName={client.name} />
                                        </TableCell>
                                        <TableCell>{client.cuit}</TableCell>
                                        <TableCell>
                                            <ClientAddressCell clientId={client.id} initialAddress={client.address} />
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
            </CardContent>
        </Card>
    )
}
