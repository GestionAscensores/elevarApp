'use client'

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ClipboardList, AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react"
import { updateTaskStatus } from "@/actions/tasks"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface PendingTasksWidgetProps {
    tasks: any[]
}

export function PendingTasksWidget({ tasks }: PendingTasksWidgetProps) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleComplete = async (id: string) => {
        setLoadingId(id)
        const res = await updateTaskStatus(id, 'DONE')
        if (res.success) {
            toast.success("Tarea completada")
            router.refresh()
        } else {
            toast.error("Error al actualizar")
        }
        setLoadingId(null)
    }

    // Show only first 5
    const displayTasks = tasks.slice(0, 5)

    return (
        <Card className="col-span-full lg:col-span-3 border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-100 rounded-full">
                            <ClipboardList className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Tareas Pendientes</CardTitle>
                            <CardDescription>Reparaciones y novedades detectadas</CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        {tasks.length} Pendientes
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {displayTasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-white/50 rounded-xl border border-dashed">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                            <p>¡Todo al día! No hay tareas pendientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayTasks.map(task => (
                                <div key={task.id} className="bg-white p-3 rounded-xl border shadow-sm hover:shadow-md transition-all flex items-start gap-3 group">
                                    <div className="mt-1">
                                        {task.priority === 'URGENT' ? (
                                            <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
                                        ) : (
                                            <Clock className="h-5 w-5 text-orange-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{task.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <span className="font-semibold text-gray-700">{task.client.name}</span>
                                            {task.equipment && (
                                                <>
                                                    <span>•</span>
                                                    <span>{task.equipment.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        title="Marcar como Completada"
                                        disabled={loadingId === task.id}
                                        onClick={() => handleComplete(task.id)}
                                    >
                                        <CheckCircle2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {tasks.length > 5 && (
                        <Link href="/dashboard/tasks">
                            <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary mt-2">
                                Ver {tasks.length - 5} tareas más <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    )}

                    {tasks.length <= 5 && tasks.length > 0 && (
                        <Link href="/dashboard/tasks">
                            <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary mt-2">
                                Ver Tablero Completo <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
