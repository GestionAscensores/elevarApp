import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SubscriptionExpiredPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-orange-500">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Suscripción Expirada
                    </CardTitle>
                    <CardDescription className="text-base">
                        Tu período de prueba o suscripción ha finalizado
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Para continuar utilizando <strong>ELEVAR APP</strong> y acceder a todas las funcionalidades de facturación electrónica y gestión de clientes, necesitas renovar tu suscripción.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                            ¿Qué incluye la suscripción?
                        </h3>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                            <li>Facturación electrónica ilimitada con AFIP</li>
                            <li>Gestión completa de clientes y equipos</li>
                            <li>Tracking de Monotributo en tiempo real</li>
                            <li>Facturación masiva y presupuestos</li>
                            <li>Soporte técnico prioritario</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    Contacta con nosotros para renovar
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Escríbenos a <a href="mailto:soporte@elevarapp.com" className="text-blue-600 underline">soporte@elevarapp.com</a> o comunícate con tu administrador.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2">
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                        <a href="mailto:soporte@elevarapp.com?subject=Renovación de Suscripción">
                            <Mail className="mr-2 h-4 w-4" />
                            Solicitar Renovación
                        </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/api/auth/signout">
                            Cerrar Sesión
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
