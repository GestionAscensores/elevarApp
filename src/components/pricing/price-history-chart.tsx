'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

export function PriceHistoryChart({ data }: { data: { month: string, averagePrice: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center  gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Evolución de Precios de los Abonos
                    </CardTitle>
                    <CardDescription>Historial de cambios en los últimos 12 meses</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No hay historial de cambios de precios aún
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Format month for display (2025-01 -> Ene 2025)
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const formattedData = data.map(item => ({
        ...item,
        monthLabel: `${monthNames[parseInt(item.month.split('-')[1]) - 1]} ${item.month.split('-')[0]}`
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Evolución de Precios de los Abonos
                </CardTitle>
                <CardDescription>
                    Precio promedio por mes - Últimos 12 meses
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="monthLabel"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            formatter={(value: any) => [`$${value}`, 'Precio Promedio']}
                            labelFormatter={(label) => `Mes: ${label}`}
                        />
                        <Line
                            type="monotone"
                            dataKey="averagePrice"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{ fill: '#2563eb', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
