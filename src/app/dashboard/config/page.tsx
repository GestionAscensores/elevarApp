import { ConfigForm } from '@/components/config/config-form'
import { getConfig } from '@/actions/config'
import { BackupButton } from '@/components/config/backup-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ConfigPage() {
    const config = await getConfig()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
                <BackupButton />
            </div>
            <ConfigForm initialConfig={config} />
        </div>
    )
}
