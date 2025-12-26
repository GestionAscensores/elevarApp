import { Suspense } from 'react'
import { getTechnicians } from '@/actions/technicians'
import { TechManagement } from '@/components/technicians/tech-management'
import { Skeleton } from '@/components/ui/skeleton'

export default async function TechniciansPage() {
    const technicians = await getTechnicians()

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Técnicos</h1>
                <p className="text-muted-foreground">
                    Gestiona los empleados que realizan las visitas de mantenimiento.
                </p>
            </div>

            <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
                <TechManagement initialTechnicians={technicians} />
            </Suspense>
        </div>
    )
}
