import { getProducts } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search } from 'lucide-react'
import { ProductActions } from '@/components/products/product-actions'
import { ProductDataActions } from '@/components/products/product-data-actions'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { InlinePriceEdit } from '@/components/products/inline-price-edit'
import { InlineNameEdit } from '@/components/products/inline-name-edit'

export default async function PricingPage() {
    const products = await getProducts()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Gestión de Precios</h1>
                <Button asChild>
                    <Link href="/dashboard/pricing/new">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                    </Link>
                </Button>
            </div>

            <ProductDataActions />

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Precios</CardTitle>
                    <CardDescription>Administra tus productos y servicios.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-8" placeholder="Buscar..." />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Descripción / Nombre</TableHead>
                                <TableHead>Moneda</TableHead>
                                <TableHead>IVA</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No hay productos registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-mono text-xs">{product.code || '-'}</TableCell>
                                        <TableCell>
                                            <InlineNameEdit id={product.id} initialName={product.name} />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.currency === 'USD' ? 'secondary' : 'outline'}>
                                                {product.currency}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {product.ivaRate ? `${product.ivaRate}%` : '21%'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <InlinePriceEdit
                                                id={product.id}
                                                initialPrice={Number(product.price)}
                                                currency={product.currency}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ProductActions id={product.id} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
