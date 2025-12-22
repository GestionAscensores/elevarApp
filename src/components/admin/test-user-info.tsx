
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, UserCog } from "lucide-react"
import { toast } from "sonner"

export function TestUserInfo() {
    const email = "usuariotest@elevarapp.com"
    const password = "test123"

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado al portapapeles`)
    }

    return (
        <Card className="bg-indigo-50 border-indigo-200">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-indigo-800">
                    <UserCog className="h-5 w-5" />
                    <CardTitle className="text-lg">Usuario de Prueba</CardTitle>
                </div>
                <CardDescription className="text-indigo-600/80">
                    Credenciales para verificación de funcionalidades.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded border border-indigo-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase">Email</p>
                            <p className="font-mono text-sm">{email}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500" onClick={() => copyToClipboard(email, 'Email')}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="bg-white p-3 rounded border border-indigo-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase">Contraseña</p>
                            <p className="font-mono text-sm">{password}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500" onClick={() => copyToClipboard(password, 'Contraseña')}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
