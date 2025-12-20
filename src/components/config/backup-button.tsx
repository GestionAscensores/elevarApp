'use client'

import { exportUserData } from '@/actions/backup'
import { Button } from '@/components/ui/button'
import { Cloud, Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function BackupButton() {
    const [loading, setLoading] = useState(false)

    const handleBackup = async () => {
        setLoading(true)
        try {
            const res = await exportUserData()
            if (res.error) {
                toast.error(res.error)
                return
            }

            if (res.data) {
                const blob = new Blob([res.data], { type: 'application/json' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `backup-elevar-${new Date().toISOString().slice(0, 10)}.json`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success("Respaldo descargado correctamente")
            }
        } catch (e) {
            toast.error("Error al descargar respaldo")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" onClick={handleBackup} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Descargar Respaldo (JSON)
        </Button>
    )
}
