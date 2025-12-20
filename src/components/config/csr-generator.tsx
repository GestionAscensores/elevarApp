
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, KeyRound, Download, ShieldCheck } from 'lucide-react'
import forge from 'node-forge'
import { toast } from 'sonner'

interface CsrGeneratorProps {
    defaultCuit?: string
    defaultName?: string
    onKeyGenerated?: (keyContent: string) => void
}

export function CsrGenerator({ defaultCuit = '', defaultName = '', onKeyGenerated }: CsrGeneratorProps) {
    const [open, setOpen] = useState(false)
    const [cuit, setCuit] = useState(defaultCuit)
    const [companyName, setCompanyName] = useState(defaultName)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedFiles, setGeneratedFiles] = useState<{ key: string, csr: string } | null>(null)

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (newOpen) {
            // Reset state when opening specifically if needed, or keep previous inputs
            if (!cuit) setCuit(defaultCuit)
            if (!companyName) setCompanyName(defaultName)
        }
    }

    const generateKeys = async () => {
        if (!cuit || !companyName) {
            toast.error("Por favor completa CUIT y Razón Social")
            return
        }

        setIsGenerating(true)
        setGeneratedFiles(null)

        try {
            // Utilizar setTimeout para no bloquear la UI inmediatamente y permitir que el spinner aparezca
            setTimeout(() => {
                try {
                    // 1. Generar Par de Claves (esto puede tardar unos segundos)
                    const keys = forge.pki.rsa.generateKeyPair(2048)

                    // 2. Crear CSR
                    const csr = forge.pki.createCertificationRequest()
                    csr.publicKey = keys.publicKey

                    // Asegurar que el CUIT solo tenga números
                    const cleanCuit = cuit.replace(/[^0-9]/g, '')

                    csr.setSubject([
                        {
                            name: 'commonName',
                            value: companyName
                        },
                        {
                            name: 'countryName',
                            value: 'AR'
                        },
                        {
                            name: 'organizationName',
                            value: companyName
                        },
                        {
                            name: 'serialNumber',
                            value: `CUIT ${cleanCuit}`
                        }
                    ])

                    // Firmar el CSR con la clave privada
                    csr.sign(keys.privateKey, forge.md.sha256.create())

                    // Convertir a PEM
                    const pemKey = forge.pki.privateKeyToPem(keys.privateKey)
                    const pemCsr = forge.pki.certificationRequestToPem(csr)

                    setGeneratedFiles({ key: pemKey, csr: pemCsr })

                    if (onKeyGenerated) {
                        onKeyGenerated(pemKey)
                        toast.success("Clave Privada insertada en el formulario")
                    }

                    setIsGenerating(false)
                } catch (err) {
                    console.error("Error en forge:", err)
                    toast.error("Error calculando claves")
                    setIsGenerating(false)
                }
            }, 100)
        } catch (error) {
            console.error(error)
            toast.error("Ocurrió un error al generar las claves")
            setIsGenerating(false)
        }
    }

    const downloadFile = (filename: string, content: string) => {
        const element = document.createElement('a')
        const file = new Blob([content], { type: 'text/plain' })
        element.href = URL.createObjectURL(file)
        element.download = filename
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    const downloadAll = () => {
        if (!generatedFiles) return
        downloadFile('privada.key', generatedFiles.key)
        downloadFile('pedido.csr', generatedFiles.csr)
        toast.success("Archivos descargados")
        setOpen(false) // Cerrar al finalizar todo o dejar abierto? Mejor dejar abierto para dar feedback.
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800">
                    <KeyRound className="h-4 w-4" />
                    Generar Claves Automáticamente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generador de Claves AFIP</DialogTitle>
                    <DialogDescription>
                        Genera tu Clave Privada y el pedido (CSR) sin usar comandos. La clave se genera en tu navegador.
                    </DialogDescription>
                </DialogHeader>

                {!generatedFiles ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="gen-cuit">CUIT (Sin guiones)</Label>
                            <Input
                                id="gen-cuit"
                                value={cuit}
                                onChange={(e) => setCuit(e.target.value)}
                                placeholder="20123456789"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="gen-name">Razón Social / Nombre</Label>
                            <Input
                                id="gen-name"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Tu Empresa S.A."
                            />
                        </div>
                        <Alert className="bg-blue-50 border-blue-100 text-blue-800">
                            <ShieldCheck className="h-4 w-4 text-blue-800" />
                            <AlertTitle className="text-sm font-semibold">Seguridad</AlertTitle>
                            <AlertDescription className="text-xs">
                                La clave privada nunca sale de tu equipo hasta que tú decides guardarla en la configuración.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-green-50 border-green-200">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                                <KeyRound className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-green-900">¡Claves Generadas!</h3>
                            <p className="text-sm text-green-700 text-center mt-1">
                                Ya hemos insertado la clave privada en el formulario.
                                Ahora descarga los archivos para continuar el trámite en AFIP.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Siguientes pasos:</div>
                            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                                <li>Descarga <strong> pedido.csr</strong> y súbelo a AFIP.</li>
                                <li>Guarda <strong>privada.key</strong> en un lugar seguro como respaldo.</li>
                                <li>Cuando AFIP te dé el <strong>.crt</strong>, cárgalo en el formulario principal.</li>
                            </ul>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-between gap-2">
                    {!generatedFiles ? (
                        <Button onClick={generateKeys} disabled={isGenerating} className="w-full">
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando (puede tardar)...
                                </>
                            ) : (
                                "Generar Archivos"
                            )}
                        </Button>
                    ) : (
                        <Button onClick={downloadAll} className="w-full gap-2" variant="default">
                            <Download className="h-4 w-4" />
                            Descargar Archivos (.key y .csr)
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
