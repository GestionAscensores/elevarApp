'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateConfig } from '@/actions/config'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { AfipInstructions } from '@/components/config/afip-instructions'
import { CsrGenerator } from '@/components/config/csr-generator'
import { ThemeSelector } from '@/components/config/theme-selector'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button className="ml-auto" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Configuración
        </Button>
    )
}

export function ConfigForm({ initialConfig, userRole }: { initialConfig: any; userRole?: string }) {
    const [state, action] = useActionState(updateConfig, undefined)
    const [certContent, setCertContent] = useState('')
    const [keyContent, setKeyContent] = useState('')
    const [logoContent, setLogoContent] = useState('')
    const [logoRemoved, setLogoRemoved] = useState(false)

    // Controlled inputs for Generator syncing
    const [cuitValue, setCuitValue] = useState(initialConfig?.user?.cuit || '')
    const [businessNameValue, setBusinessNameValue] = useState(initialConfig?.businessName || '')


    useEffect(() => {
        if (state?.success) {
            toast.success(state.message)
        } else if (state?.message) {
            toast.error(state.message)
        }
    }, [state])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setContent: (val: string) => void) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setContent(event.target?.result as string)
            }
            reader.readAsText(file) // For Certs/Keys
        }
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setLogoContent(event.target?.result as string)
                setLogoRemoved(false)
            }
            reader.readAsDataURL(file) // For Images
        }
    }

    const handleRemoveLogo = () => {
        setLogoContent('')
        setLogoRemoved(true)
    }

    const currentLogo = logoRemoved ? null : (logoContent || initialConfig?.logoUrl)
    const logoInputValue = logoRemoved ? '' : (logoContent || initialConfig?.logoUrl || '')

    return (
        <Card className="max-w-3xl">
            <CardHeader>
                <CardTitle>Credenciales ARCA (ex AFIP)</CardTitle>
                <CardDescription>Cargue su certificado y clave privada para facturar.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action} className="space-y-6">
                    {/* APPEARANCE SELECTOR */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                        <Label className="text-base font-semibold">Apariencia</Label>
                        <p className="text-xs text-muted-foreground mb-2">Selecciona el tema visual de la aplicación.</p>
                        <ThemeSelector />
                    </div>

                    {/* ENVIRONMENT SELECTOR - ADMIN ONLY */}
                    {userRole === 'ADMIN' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                            <Label className="text-base font-semibold">Entorno de Facturación</Label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="env-test"
                                        name="afipEnvironment"
                                        value="TEST"
                                        defaultChecked={!initialConfig?.afipEnvironment || initialConfig.afipEnvironment === 'TEST'}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <Label htmlFor="env-test" className="font-normal cursor-pointer">
                                        Modo Pruebas (Homologación)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="env-prod"
                                        name="afipEnvironment"
                                        value="PRODUCTION"
                                        defaultChecked={initialConfig?.afipEnvironment === 'PRODUCTION'}
                                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                    />
                                    <Label htmlFor="env-prod" className="font-normal cursor-pointer text-red-700 font-bold">
                                        Modo Producción (Real)
                                    </Label>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                ⚠️ <strong>Importante:</strong> Si cambia de entorno, debe volver a cargar el Certificado (.crt) y Clave (.key) generados para el entorno seleccionado. Los certificados de prueba no funcionan en producción y viceversa.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5 border-b border-t py-4 my-2 border-dashed bg-blue-50 dark:bg-blue-950/10 px-4 rounded-lg">
                            <Label htmlFor="cuit" className="font-semibold text-blue-700">CUIT del Emisor</Label>
                            <Input
                                type="text"
                                id="cuit"
                                name="cuit"
                                value={cuitValue}
                                onChange={(e) => setCuitValue(e.target.value)}
                                placeholder="20-12345678-9"
                                className="border-blue-200 bg-white"
                                maxLength={13}
                            />
                            <p className="text-xs text-muted-foreground">
                                CUIT registrado en ARCA/AFIP para facturación electrónica. <strong>Requerido para facturar.</strong>
                            </p>
                        </div>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="salePoint">Punto de Venta (ARCA)</Label>
                            <Input type="number" id="salePoint" name="salePoint" defaultValue={initialConfig?.salePoint || 1} min="1" />
                            <p className="text-xs text-muted-foreground">Número de punto de venta registrado en ARCA para Factura Electrónica.</p>
                            <p className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 p-2 rounded mt-1">
                                💡 <strong>Importante:</strong> Si migras de otro sistema, usa el <strong>mismo Punto de Venta</strong> para mantener la continuidad de tus estadísticas y numeración.
                            </p>
                        </div>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="businessName">Razón Social (Emisor Real)</Label>
                            <Input
                                type="text"
                                id="businessName"
                                name="businessName"
                                value={businessNameValue}
                                onChange={(e) => setBusinessNameValue(e.target.value)}
                                placeholder="Ej: Juan Perez"
                            />
                            <p className="text-xs text-muted-foreground">Nombre legal que aparecerá como emisor en la factura.</p>
                        </div>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="businessAddress">Dirección Comercial</Label>
                            <Input
                                type="text"
                                id="businessAddress"
                                name="businessAddress"
                                defaultValue={initialConfig?.businessAddress || ''}
                                placeholder="Ej: Av. Siempreviva 123, CABA"
                            />
                        </div>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="businessPhone">Teléfono Comercial</Label>
                            <Input
                                type="text"
                                id="businessPhone"
                                name="businessPhone"
                                defaultValue={initialConfig?.businessPhone || ''}
                                placeholder="Ej: 11 1234 5678"
                            />
                        </div>

                        <div className="grid w-full max-w-sm items-center gap-1.5 border-b border-t py-4 my-2 border-dashed">
                            <Label htmlFor="email" className="font-semibold text-blue-700">Email de Contacto / Respuesta</Label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                defaultValue={initialConfig?.businessEmail || initialConfig?.user?.email || ''}
                                placeholder="tu-email@ejemplo.com"
                                className="border-blue-200 bg-blue-50"
                            />
                            <p className="text-xs text-muted-foreground">
                                Este email recibirán los clientes cuando respondan a tus facturas.
                            </p>
                        </div>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="fantasyName">Nombre de Fantasía (Opcional)</Label>
                            <Input
                                type="text"
                                id="fantasyName"
                                name="fantasyName"
                                defaultValue={initialConfig?.fantasyName || ''}
                                placeholder="Ej: Mi Empresa S.A."
                            />
                            <p className="text-xs text-muted-foreground">Se mostrará en el encabezado de la factura y como <strong>nombre del remitente</strong> en los correos.</p>
                        </div>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="logoFile">Logo de la Empresa</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    type="file"
                                    id="logoFile"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="cursor-pointer"
                                />
                                <input type="hidden" name="logoUrl" value={logoInputValue} />

                                {currentLogo && (
                                    <div className="mt-2 border rounded-md p-2 w-fit bg-gray-50">
                                        <div className="flex justify-between items-center mb-2 gap-4">
                                            <p className="text-xs text-muted-foreground">Vista previa:</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="h-6 text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                        <img
                                            src={currentLogo}
                                            alt="Logo Preview"
                                            className="h-16 w-auto object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Suba una imagen (PNG/JPG). Máx 200KB recomendado. Tamaño ideal: 200x72 px.</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ivaCondition">Condición frente al IVA</Label>
                            <div className="relative">
                                <select
                                    id="ivaCondition"
                                    name="ivaCondition"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    defaultValue={initialConfig?.ivaCondition || 'Responsable Inscripto'}
                                >
                                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                                    <option value="Monotributo">Monotributo</option>
                                    <option value="Exento">Exento</option>
                                    <option value="Consumidor Final">Consumidor Final</option>
                                </select>
                            </div>
                        </div>

                        <AfipInstructions />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Clave Privada (.key)</Label>
                                <CsrGenerator
                                    defaultCuit={cuitValue}
                                    defaultName={businessNameValue}
                                    onKeyGenerated={(key) => setKeyContent(key)}
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <Input type="file" accept=".key,.pem" onChange={(e) => handleFileChange(e, setKeyContent)} className="cursor-pointer" />
                            </div>
                            <Textarea
                                name="key"
                                placeholder="Pegue el contenido de la clave privada aquí o suba el archivo..."
                                value={keyContent}
                                onChange={(e) => setKeyContent(e.target.value)}
                                className="font-mono text-xs h-32"
                            />
                            {initialConfig?.keyEncrypted && <p className="text-xs text-green-600">✓ Clave privada cargada previamente</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Certificado (.crt)</Label>
                            <div className="flex gap-2 items-center">
                                <Input type="file" accept=".crt,.pem" onChange={(e) => handleFileChange(e, setCertContent)} className="cursor-pointer" />
                            </div>
                            <Textarea
                                name="cert"
                                placeholder="Pegue el contenido del certificado aquí o suba el archivo..."
                                value={certContent}
                                onChange={(e) => setCertContent(e.target.value)}
                                className="font-mono text-xs h-32"
                            />
                            {initialConfig?.certEncrypted && <p className="text-xs text-green-600">✓ Certificado cargado previamente</p>}
                        </div>

                        <div className="border-t pt-4 mt-6">
                            <h3 className="font-semibold text-lg mb-4">Personalización de Correos</h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="emailSubject">Asunto del Email</Label>
                                    <Input
                                        id="emailSubject"
                                        name="emailSubject"
                                        defaultValue={initialConfig?.emailSubject || ''}
                                        placeholder="Facturación Ascensor {{cliente}}"
                                    />
                                    <p className="text-xs text-muted-foreground">Variables disponibles: {"{{numero}}"}, {"{{cliente}}"}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="emailBody">Cuerpo del Email</Label>
                                    <Textarea
                                        id="emailBody"
                                        name="emailBody"
                                        defaultValue={initialConfig?.emailBody || ''}
                                        placeholder={`Se adjunta comprobantes por mantenimiento Asc. correspondiente al mes de {{mes}}.\n\nSaludos cordiales.`}
                                        className="h-32"
                                    />
                                    <p className="text-xs text-muted-foreground">Variables disponibles: {"{{numero}}"}, {"{{cliente}}"}, {"{{mes}}"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
