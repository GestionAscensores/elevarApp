'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientInvoiceListProps {
    invoices: any[]
}

export function ClientInvoiceList({ invoices }: ClientInvoiceListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial de Facturas</CardTitle>
                <CardDescription>Últimas facturas emitidas a este cliente.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Número</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hay facturas registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        {format(new Date(invoice.date), 'dd/MM/yyyy', { locale: es })}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <Link href={`/dashboard/billing/${invoice.id}?readonly=true`} className="hover:underline text-blue-600">
                                            {invoice.status === 'PROVISIONAL' || invoice.type === 'Provisional'
                                                ? `Borrador #${invoice.draftNumber || '?'}`
                                                : `${String(invoice.pointOfSale).padStart(4, '0')}-${String(invoice.number).padStart(8, '0')}`
                                            }
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{invoice.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={
                                            invoice.status === 'APPROVED' ? 'bg-green-500' :
                                                invoice.status === 'PROVISIONAL' ? 'bg-orange-500' :
                                                    invoice.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-500'
                                        }>
                                            {invoice.status === 'APPROVED' ? 'Emitida' :
                                                invoice.status === 'PROVISIONAL' ? 'Provisional' :
                                                    invoice.status === 'REJECTED' ? 'Rechazada' : 'Borrador'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(invoice.totalAmount))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" asChild>
                                            <Link href={`/dashboard/billing/${invoice.id}?readonly=true`}>
                                                <FileText className="h-4 w-4" />
                                            </Link>
                                        </Button>
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
