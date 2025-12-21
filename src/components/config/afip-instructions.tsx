
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExternalLink, Info } from "lucide-react"

export function AfipInstructions() {
    return (
        <div className="my-6">
            <Accordion type="single" collapsible className="w-full border rounded-lg px-4 bg-muted/20">
                <AccordionItem value="afip-instructions" className="border-none">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Info className="h-4 w-4" />
                            <span>¿Cómo obtener mi Certificado y Clave Privada?</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2 text-sm text-muted-foreground">
                        <p>
                            Para facturar electrónicamente, necesitas generar un certificado digital en AFIP.
                            Sigue estos pasos resumidos:
                        </p>

                        <div className="space-y-4 pl-2">
                            <div className="relative border-l-2 border-blue-200 pl-4 py-1">
                                <h4 className="font-semibold text-foreground">1. Generar Clave Privada y CSR</h4>
                                <p className="mb-2">
                                    Utiliza el botón <strong>"Generar Claves Automáticamente"</strong> que encontrarás más abajo, junto al campo "Clave Privada".
                                </p>
                                <ul className="list-disc list-inside space-y-1 mt-1 text-xs">
                                    <li>Completa tu CUIT y Razón Social en el formulario principal.</li>
                                    <li>Haz clic en el botón y confirma la generación.</li>
                                    <li>Se descargarán dos archivos: <code>privada.key</code> (para tu respaldo) y <code>pedido.csr</code> (para subir a AFIP).</li>
                                    <li>La clave privada se insertará automáticamente en el formulario.</li>
                                </ul>
                            </div>

                            <div className="relative border-l-2 border-blue-200 pl-4 py-1">
                                <h4 className="font-semibold text-foreground">2. Obtener Certificado en AFIP</h4>
                                <ul className="list-disc list-inside space-y-1 mt-1">
                                    <li>Ingresa a la web de AFIP con tu Clave Fiscal.</li>
                                    <li>Entra al servicio <strong>"Administración de Certificados Digitales"</strong>.</li>
                                    <li>Elige el alias/contribuyente.</li>
                                    <li>Haz clic en <strong>"Agregar Alias"</strong> (ej: 'facturacion_web') si no tienes uno.</li>
                                    <li>Selecciona <strong>"Ver"</strong> en el alias y luego el link <strong>"Subir Pedido o CSR"</strong>.</li>
                                    <li>Sube el archivo <code>pedido.csr</code> generado en el paso 1.</li>
                                    <li>Descarga el archivo <code>.crt</code> (Certificado) que te devuelve AFIP.</li>
                                </ul>
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                    <strong>¿Error "La autorización ya existe"?</strong>
                                    <br />
                                    Significa que ya creaste este Alias antes. No intentes crear uno nuevo. Busca el alias existente (ej: "facturardor Elevar App") en la lista, haz clic en "Ver Detalles" (lupa) y sube el certificado ahí.
                                </div>
                            </div>

                            <div className="relative border-l-2 border-blue-200 pl-4 py-1">
                                <h4 className="font-semibold text-foreground">3. Autorizar Servicio Web (WSFE)</h4>
                                <ul className="list-disc list-inside space-y-1 mt-1">
                                    <li>Vuelve al menú principal de AFIP.</li>
                                    <li>Entra a <strong>"Administrador de Relaciones de Clave Fiscal"</strong>.</li>
                                    <li>Selecciona <strong>"Nueva Relación"</strong>.</li>
                                    <li>Busca el servicio: <strong>AFIP &gt; WebServices &gt; Facturación Electrónica</strong>.</li>
                                    <li>En <strong>"Representante"</strong>, busca y selecciona el <strong>Computador Fiscal</strong> (el alias que creaste en el paso anterior).</li>
                                    <li>Confirma la relación.</li>
                                </ul>
                            </div>

                            <Alert className="bg-amber-50 border-amber-200 mt-4">
                                <Info className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800">Importante</AlertTitle>
                                <AlertDescription className="text-amber-700 text-xs">
                                    Finalmente, sube el archivo <code>privada.key</code> (Paso 1) y el archivo <code>.crt</code> (Paso 2) en los campos de abajo.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
