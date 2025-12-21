'use client'

import { useState, useTransition } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Trash2, Send, Pencil } from "lucide-react"
import Link from "next/link"
import { deleteInvoices, emitInvoices } from "@/actions/billing"
import { PrintDraftButton } from './print-draft-button'
import { EmitInvoiceButton } from './emit-button'
import { DeleteInvoiceButton } from './delete-button'

interface DraftsTableProps {
    drafts: any[]
}

export function DraftsTable({ drafts }: DraftsTableProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(drafts.map(d => d.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id])
        } else {
            setSelectedIds(prev => prev.filter(x => x !== id))
        }
    }

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return
        if (!confirm(`¿Estás seguro de eliminar ${selectedIds.length} borradores?`)) return

        startTransition(async () => {
            try {
                const res = await deleteInvoices(selectedIds)
                if (res.success) {
                    toast.success(res.message)
                    setSelectedIds([])
                } else {
                    toast.error(res.message)
                    if (res.errors) {
                        res.errors.forEach(e => toast.error(e))
                    }
                }
            } catch (error) {
                toast.error("Error al eliminar borradores")
            }
        })
    }

    const handleBulkEmit = () => {
        if (selectedIds.length === 0) return
        if (!confirm(`¿Estás seguro de emitir ${selectedIds.length} facturas a AFIP?`)) return

        startTransition(async () => {
            try {
                const res = await emitInvoices(selectedIds)
                if (res.success) {
                    toast.success(res.message)
                    setSelectedIds([])
                } else {
                    toast.error(res.message)
                    if (res.errors) {
                        res.errors.forEach(e => toast.error(e))
                    }
                }
            } catch (error) {
                toast.error("Error al emitir facturas")
            }
        })
    }

    if (drafts.length === 0) return null

    return (
        <Card className="border-yellow-200 bg-yellow-50/10">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-yellow-700">Borradores</CardTitle>
                        <CardDescription>Borradores pendientes de impresión o emisión.</CardDescription>
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground mr-2">
                                {selectedIds.length} seleccionados
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Eliminar
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleBulkEmit}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Emitir a AFIP
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.length === drafts.length && drafts.length > 0}
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                />
                            </TableHead>
                            <TableHead>Fecha Gen.</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead className="text-right">Total Estimado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {drafts.map((inv) => (
                            <TableRow key={inv.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.includes(inv.id)}
                                        onCheckedChange={(checked) => handleSelectOne(inv.id, checked as boolean)}
                                    />
                                </TableCell>
                                <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="font-medium">{inv.client?.name}</TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                    {inv.items?.[0]?.description || 'Vario'}
                                </TableCell>
                                <TableCell className="text-right font-bold">${Number(inv.totalAmount).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <PrintDraftButton invoice={inv} />
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" asChild title="Editar">
                                            <Link href={`/dashboard/billing/${inv.id}/edit`}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <EmitInvoiceButton id={inv.id} />
                                        <DeleteInvoiceButton id={inv.id} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
