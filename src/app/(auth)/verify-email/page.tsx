import { VerificationForm } from '@/components/auth/verification-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-green-600">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">Verificar Email</CardTitle>
                    <CardDescription className="text-center">
                        Ingresa el código que te enviamos para activar tu cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VerificationForm />
                </CardContent>
            </Card>
        </div>
    )
}
