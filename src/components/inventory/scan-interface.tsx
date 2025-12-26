'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { getProductByBarcode, updateProductStock, setProductBarcode } from '@/actions/inventory'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'sonner'
import { Loader2, Plus, Minus, RefreshCw, Barcode } from 'lucide-react'

// Define the scanner instance type loosely or use `any` if types are tricky with the library import
// We'll import dynamically or just use standard import if `npm i` finished.

export function ScanInterface() {
    const [scannedCode, setScannedCode] = useState<string | null>(null)
    const [product, setProduct] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)
    const [stockDelta, setStockDelta] = useState(1) // How much to add/remove
    const [scannerInitialized, setScannerInitialized] = useState(false)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    // Effect to init scanner
    useEffect(() => {
        // We only init if we haven't scanned something yet, or if we reset
        if (!scannedCode && !scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.QR_CODE
                    ]
                },
                /* verbose= */ false
            )

            scanner.render(onScanSuccess, onScanFailure)
            scannerRef.current = scanner
            setScannerInitialized(true)
        }

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error)
                scannerRef.current = null
            }
        }
    }, [scannedCode])

    const onScanSuccess = async (decodedText: string, decodedResult: any) => {
        if (loading) return
        console.log(`Code matched = ${decodedText}`, decodedResult)

        // Stop scanning temporarily
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error)
            scannerRef.current = null // Force re-init later
        }

        setScannedCode(decodedText)
        handleProductLookup(decodedText)
    }

    const onScanFailure = (error: any) => {
        // console.warn(error) // Too noisy
    }

    const handleProductLookup = async (code: string) => {
        setLoading(true)
        const result = await getProductByBarcode(code)
        setLoading(false)

        if (result.product) {
            setProduct(result.product)
            toast.success("Producto encontrado")
        } else {
            setProduct(null)
            toast("Producto no encontrado. ¿Deseas crearlo o asociarlo?", {
                action: {
                    label: "Asociar a existente (Manual)",
                    onClick: () => console.log("Not implemented: manual assoc")
                }
            })
        }
    }

    const handleStockUpdate = async (delta: number) => {
        if (!product) return
        setLoading(true)
        const result = await updateProductStock(product.id, delta)
        setLoading(false)

        if (result.success) {
            toast.success(`Stock actualizado: ${result.newStock}`)
            setProduct({ ...product, stock: result.newStock })
        } else {
            toast.error(result.error)
        }
    }

    const resetScan = () => {
        setScannedCode(null)
        setProduct(null)
        // Effect will re-init scanner
    }

    return (
        <div className="flex flex-col gap-4 max-w-md mx-auto p-2">
            {!scannedCode && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">Escanear Producto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div id="reader" className="overflow-hidden rounded-lg"></div>
                        <p className="text-sm text-center text-muted-foreground mt-2">
                            Apunta la cámara al código de barras o QR
                        </p>
                    </CardContent>
                </Card>
            )}

            {scannedCode && !product && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="text-orange-900">Código: {scannedCode}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-orange-800 mb-4">No se encontró ningún producto con este código.</p>
                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => toast.info("Funcionalidad de crear producto próximamente")}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Producto
                        </Button>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={resetScan}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Escanear otro
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {product && (
                <Card className="border-green-200">
                    <CardHeader className="bg-green-50 rounded-t-lg">
                        <CardTitle className="text-green-900 flex justify-between items-start">
                            <span>{product.name}</span>
                            <span className="text-sm font-normal bg-white px-2 py-1 rounded border border-green-200">
                                Stock: {product.stock}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-16 w-16 rounded-full border-2 border-slate-200"
                                onClick={() => handleStockUpdate(-1)}
                                disabled={loading}
                            >
                                <Minus className="h-8 w-8 text-slate-500" />
                            </Button>

                            <div className="flex-1 text-center">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Cantidad</Label>
                                <div className="text-4xl font-bold tabular-nums text-slate-900">
                                    {product.stock}
                                </div>
                            </div>

                            <Button
                                size="lg"
                                variant="outline"
                                className="h-16 w-16 rounded-full border-2 border-slate-200"
                                onClick={() => handleStockUpdate(1)}
                                disabled={loading}
                            >
                                <Plus className="h-8 w-8 text-slate-500" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4">
                            <Button variant="outline" className="h-12 border-red-100 bg-red-50 text-red-900 hover:bg-red-100" onClick={() => handleStockUpdate(-5)}>
                                - 5 u.
                            </Button>
                            <Button variant="outline" className="h-12 border-blue-100 bg-blue-50 text-blue-900 hover:bg-blue-100" onClick={() => handleStockUpdate(5)}>
                                + 5 u.
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 rounded-b-lg pt-4">
                        <Button className="w-full" onClick={resetScan}>
                            <Barcode className="mr-2 h-4 w-4" /> Escanear Siguiente
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
