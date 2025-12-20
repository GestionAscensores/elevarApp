'use client'

import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"

interface TrialBannerProps {
    trialEndsAt: Date | string | null
    status: string
}

export function TrialBanner({ trialEndsAt, status }: TrialBannerProps) {
    console.log('TrialBanner Render:', { status, trialEndsAt })

    if (status !== 'trial' || !trialEndsAt) {
        console.log('TrialBanner: Not showing (status/date mismatch)')
        return null
    }

    const today = new Date()
    const endDate = new Date(trialEndsAt)
    const totalDays = 30 // Assuming standard 30 day trial

    // Calculate days remaining
    const diffTime = endDate.getTime() - today.getTime()
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    // Calculate progress percentage (inverse: 0 days left = 100% used)
    // Or better: show how much is LEFT.
    // Standard UI pattern: Bar fills up as time passes.
    // If daysRemaining = 30, used = 0%.
    // If daysRemaining = 0, used = 100%.
    const daysUsed = Math.max(0, totalDays - daysRemaining)
    const progress = Math.min(100, (daysUsed / totalDays) * 100)

    // Alert colors based on urgency
    const isUrgent = daysRemaining <= 5

    return (
        <div className={`border rounded-lg p-4 mb-6 ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`h-5 w-5 ${isUrgent ? 'text-red-500' : 'text-blue-500'}`} />
                <h3 className={`font-semibold ${isUrgent ? 'text-red-700' : 'text-blue-700'}`}>
                    Periodo de Prueba {isUrgent ? 'Por Finalizar' : 'Activo'}
                </h3>
            </div>

            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                    Quedan <strong>{daysRemaining} días</strong> de prueba gratuita
                </span>
                <span className="text-gray-500">{progress.toFixed(0)}% completado</span>
            </div>

            <Progress
                value={progress}
                className={`h-2 ${isUrgent ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
            />

            {daysRemaining === 0 && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                    Tu prueba ha finalizado. Suscríbete para continuar usando todas las funciones.
                </p>
            )}
        </div>
    )
}
