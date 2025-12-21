'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { differenceInDays } from "date-fns"

interface TrialGaugeProps {
    trialEndsAt: Date
}

export function TrialGauge({ trialEndsAt }: TrialGaugeProps) {
    const daysRemaining = Math.max(0, differenceInDays(new Date(trialEndsAt), new Date()))
    const totalDays = 15 // Current default

    // Calculate percentage for needle (0 days = empty/red, 15 days = full/green)
    // Wait, fuel gauge: Full (15) is good, Empty (0) is bad.
    // Standard gauge 180 degrees.
    // 0 days = 0 deg (E), 15 days = 180 deg (F).

    const percentage = Math.min(100, Math.max(0, (daysRemaining / totalDays) * 100))
    const rotation = (percentage / 100) * 180

    // Color logic
    let colorClass = "text-green-500"
    if (daysRemaining <= 3) colorClass = "text-red-500"
    else if (daysRemaining <= 7) colorClass = "text-yellow-500"

    return (
        <Card className="col-span-full lg:col-span-3 border-orange-200 bg-orange-50/30 dark:border-orange-900/50 dark:bg-orange-950/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Periodo de Prueba
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pb-6">
                {/* Gauge Container */}
                <div className="relative w-48 h-24 overflow-hidden mb-2">
                    {/* Background Arc */}
                    <div className="absolute top-0 left-0 w-full h-48 border-[12px] border-gray-200 rounded-full box-border" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>

                    {/* Needle/Indicator - Using a simple rotated div for the "hand" */}
                    <div
                        className="absolute bottom-0 left-1/2 w-full h-1 bg-transparent origin-left transition-transform duration-1000 ease-out z-10"
                        style={{
                            transform: `rotate(${rotation}deg) translateX(-50%)`, // Logic tweak needed for origin
                            // Actually easier: Rotate a container centered at bottom
                        }}
                    >
                    </div>

                    {/* SVG Implementation for better control */}
                    <svg viewBox="0 0 200 100" className="w-full h-full">
                        {/* Background Arc */}
                        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#e5e7eb" strokeWidth="20" strokeLinecap="round" />

                        {/* Value Arc (optional, maybe just needle is enough request) */}
                        <path
                            d="M 10 100 A 90 90 0 0 1 190 100"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="20"
                            strokeLinecap="round"
                            className={colorClass}
                            strokeDasharray="283" // pi * r (approx 90 * 3.14)
                            strokeDashoffset={283 - (283 * percentage / 100)} // Inverse because usually full is good? 
                        // Actually fuel gauge: F is right, E is left. 
                        // 0 deg = Left (Empty). 180 deg = Right (Full).
                        // My strokeDash logic draws from Left to Right.
                        // If percentage is high (Full), we want full arc.
                        />
                    </svg>

                    {/* Text Central */}
                    <div className="absolute bottom-0 left-0 w-full text-center">
                        <span className={`text-4xl font-bold ${colorClass}`}>{daysRemaining}</span>
                        <span className="text-xs text-muted-foreground ml-1">días</span>
                    </div>
                </div>

                {/* Labels */}
                <div className="w-full flex justify-between px-8 text-xs font-bold text-muted-foreground mt-2">
                    <span>E</span>
                    <span>combustible</span>
                    <span>F</span>
                </div>

                <p className="text-sm text-center text-muted-foreground mt-4">
                    {daysRemaining === 0
                        ? "Tu prueba ha finalizado. Suscríbete para continuar."
                        : "Disfruta de todas las funciones premium."}
                </p>

            </CardContent>
        </Card>
    )
}
