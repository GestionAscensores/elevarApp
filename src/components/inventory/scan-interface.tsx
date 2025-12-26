'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { getProductByBarcode, updateProductStock, setProductBarcode, updateProductImage, createInventoryProduct } from '@/actions/inventory'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'sonner'
import { Loader2, Plus, Minus, RefreshCw, Barcode, Camera, Search } from 'lucide-react'

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

    // Quick Create State
    const [createLoading, setCreateLoading] = useState(false)
    const [newName, setNewName] = useState('')
    const [newPrice, setNewPrice] = useState('')
    const [newImageBase64, setNewImageBase64] = useState<string | null>(null) // New image state

    const handleCreateProduct = async () => {
        if (!scannedCode || !newName || !newPrice) return
        setCreateLoading(true)

        const result = await createInventoryProduct({
            barcode: scannedCode,
            name: newName,
            price: parseFloat(newPrice),
            stock: 0 // Start with 0, user can add immediately
        })

        if (result.success && result.product) {
            // Upload image if selected
            if (newImageBase64) {
                await updateProductImage(result.product.id, newImageBase64)
                result.product.imageUrl = newImageBase64
            }

            setCreateLoading(false)
            toast.success("Producto creado")
            setProduct(result.product)

            // Clear form
            setNewName('')
            setNewPrice('')
            setNewImageBase64(null)
        } else {
            setCreateLoading(false)
            toast.error(result.error)
        }
    }

    const [imageLoading, setImageLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const newFileInputRef = useRef<HTMLInputElement>(null) // Ref for new product image
    const [manualCode, setManualCode] = useState('')

    const handleManualSearch = () => {
        if (manualCode.trim()) {
            onScanSuccess(manualCode.trim(), null)
            setManualCode('')
        }
    }

    // Generic Image Handler (reuses resizing logic)
    const processImage = (file: File, callback: (base64: string) => void) => {
        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const MAX_WIDTH = 800
                const MAX_HEIGHT = 800
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
                callback(dataUrl)
            }
            img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !product) return

        setImageLoading(true)
        processImage(file, (base64) => {
            saveImage(base64)
        })
    }

    const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        processImage(file, (base64) => {
            setNewImageBase64(base64)
        })
    }

    const saveImage = async (base64: string) => {
        if (!product) return
        const result = await updateProductImage(product.id, base64)
        setImageLoading(false)
        if (result.success) {
            toast.success("Imagen guardada")
            setProduct({ ...product, imageUrl: base64 })
        } else {
            toast.error(result.error)
        }
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

            {!scannedCode && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-center">Ingreso Manual</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2 p-4">
                        <Input
                            placeholder="Escribe el código..."
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleManualSearch()
                            }}
                            className="h-14 text-lg bg-white border-slate-300"
                        />
                        <Button onClick={handleManualSearch} disabled={!manualCode} className="h-14 w-14 shrink-0">
                            <Search className="h-6 w-6" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {scannedCode && !product && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="text-orange-900">Nuevo Producto</CardTitle>
                        <CardDescription>
                            Código: <span className="font-mono font-bold">{scannedCode}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                        {/* New Image Preview/Upload */}
                        <div className="flex justify-center mb-4">
                            <div
                                className="relative h-32 w-32 bg-white rounded-xl border-2 border-dashed border-orange-300 flex items-center justify-center cursor-pointer overflow-hidden"
                                onClick={() => newFileInputRef.current?.click()}
                            >
                                {newImageBase64 ? (
                                    <img src={newImageBase64} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-orange-400">
                                        <Camera className="h-10 w-10 mb-1" />
                                        <span className="text-xs font-bold">AGREGAR FOTO</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={newFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleNewImageSelect}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-base">Nombre del Producto</Label>
                            <Input
                                id="name"
                                placeholder="Ej. Plaqueta Maniobra"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="h-14 text-lg bg-white border-orange-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-base">Precio (ARS)</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="0.00"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="h-14 text-lg bg-white border-orange-200"
                            />
                        </div>
                        <Button
                            className="w-full h-14 text-lg bg-orange-600 hover:bg-orange-700 text-white mt-4 font-bold rounded-xl shadow-md"
                            onClick={handleCreateProduct}
                            disabled={createLoading || !newName || !newPrice}
                        >
                            {createLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Plus className="mr-2 h-6 w-6" />}
                            Crear Producto
                        </Button>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full border-orange-200 bg-white" onClick={resetScan}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Cancelar / Escanear otro
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {product && (
                <Card className="border-green-200 overflow-hidden">
                    <div className="relative h-64 bg-slate-100 flex items-center justify-center"> {/* Increased Height */}
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-slate-400 flex flex-col items-center">
                                <Camera className="h-16 w-16 mb-2 opacity-30" />
                                <span className="text-base font-medium">Sin imagen</span>
                            </div>
                        )}

                        <Button
                            size="icon"
                            className="absolute bottom-4 right-4 h-16 w-16 rounded-full shadow-xl bg-slate-900 hover:bg-slate-800"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imageLoading}
                        >
                            {imageLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageUpload}
                        />
                    </div>

                    <CardHeader className="bg-green-50">
                        <CardTitle className="text-green-900 flex justify-between items-start">
                            <span>{product.name}</span>
                            <span className="text-sm font-normal bg-white px-2 py-1 rounded border border-green-200">
                                Stock: {product.stock}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-20 w-20 rounded-2xl border-2 border-slate-200 shadow-sm active:scale-95 transition-transform"
                                onClick={() => handleStockUpdate(-1)}
                                disabled={loading}
                            >
                                <Minus className="h-10 w-10 text-slate-600" />
                            </Button>

                            <div className="flex-1 text-center bg-slate-50 py-2 rounded-xl border border-slate-100">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold block mb-1">Cantidad Actual</Label>
                                <div className="text-6xl font-black tabular-nums text-slate-900 tracking-tight">
                                    {product.stock}
                                </div>
                            </div>

                            <Button
                                size="lg"
                                variant="outline"
                                className="h-20 w-20 rounded-2xl border-2 border-slate-200 shadow-sm active:scale-95 transition-transform"
                                onClick={() => handleStockUpdate(1)}
                                disabled={loading}
                            >
                                <Plus className="h-10 w-10 text-slate-600" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button variant="outline" className="h-14 text-base font-medium border-red-100 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200" onClick={() => handleStockUpdate(-5)}>
                                - 5 u.
                            </Button>
                            <Button variant="outline" className="h-14 text-base font-medium border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200" onClick={() => handleStockUpdate(5)}>
                                + 5 u.
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 rounded-b-xl pt-6 pb-6 border-t border-slate-100">
                        <Button className="w-full h-14 text-lg font-bold shadow-md bg-slate-900 text-white hover:bg-slate-800" onClick={resetScan}>
                            <Barcode className="mr-2 h-6 w-6" /> Terminar / Siguiente
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div >
    )
}
