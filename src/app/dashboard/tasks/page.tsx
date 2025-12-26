import { getPendingTasks } from '@/actions/tasks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateTaskStatus } from '@/actions/tasks' // I'll need a client component for interactive actions or use server forms

export default async function TasksPage() {
    // In a real app we might paginate or filter by user role
    const tasks = await getPendingTasks()

    // Group tasks by Client Name
    const groupedTasks: Record<string, typeof tasks> = {}
    tasks.forEach(task => {
        const clientName = task.client.name
        if (!groupedTasks[clientName]) {
            groupedTasks[clientName] = []
        }
        groupedTasks[clientName].push(task)
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tareas Pendientes</h1>
                <p className="text-muted-foreground">Gestión de reparaciones y tareas solicitadas por técnicos.</p>
            </div>

            {Object.keys(groupedTasks).length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mb-2 text-green-500" />
                        <p>No hay tareas pendientes. ¡Todo al día!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {Object.entries(groupedTasks).map(([clientName, clientTasks]) => (
                        <Card key={clientName}>
                            <CardHeader className="bg-gray-50/50 pb-3">
                                <CardTitle className="text-xl flex items-center justify-between">
                                    {clientName}
                                    <Badge variant="secondary">{clientTasks.length} pendientes</Badge>
                                </CardTitle>
                                <CardDescription>{clientTasks[0].client.address}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-4">
                                {clientTasks.map(task => (
                                    <div key={task.id} className="flex items-start justify-between border-b last:border-0 pb-4 last:pb-0">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                {task.priority === 'URGENT' ? (
                                                    <Badge variant="destructive" className="flex gap-1 text-[10px] h-5">
                                                        <AlertTriangle className="h-3 w-3" /> URGENTE
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] h-5">NORMAL</Badge>
                                                )}
                                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {new Date(task.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="font-medium text-base mt-1">{task.description}</p>
                                            {task.equipment && (
                                                <p className="text-sm text-blue-600 font-medium">
                                                    Equipo: {task.equipment.name} ({task.equipment.type})
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Reportado por: {task.createdBy || 'Sistema'}
                                            </p>
                                        </div>
                                        {/* Action Button: I'll use a server action form wrapper here or inline it if simple */}
                                        <form action={async () => {
                                            'use server'
                                            await updateTaskStatus(task.id, 'DONE')
                                        }}>
                                            <Button size="sm" variant="outline" className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Finalizar
                                            </Button>
                                        </form>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
