
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, Loader2, FileUp } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ProductDataActions() {
    const [importing, setImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/products/import', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error('Error en importación')

            const data = await res.json()
            toast.success(`Importación completada. Procesados: ${data.count}`)
            router.refresh()
        } catch (error) {
            toast.error('Falló la importación')
            console.error(error)
        } finally {
            setImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
                <a href="/api/products/export" target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </a>
            </Button>
            <Button variant="outline" size="sm" disabled={importing} onClick={() => fileInputRef.current?.click()}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Importar CSV
            </Button>
            <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImport}
            />
        </div>
    )
}
