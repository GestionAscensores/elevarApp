'use client'

import { useState } from 'react'
import { PublicStatus } from './public-status'
import { TechLoginModal } from './tech-login-modal'
import { VisitForm } from './visit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ScanPageManagerProps {
    clientId: string
    equipmentId?: string
    initialData: {
        clientName: string
        clientAddress: string | null
        companyId: string
        status: string
        lastVisit: any
    }
}

export function ScanPageManager({ clientId, equipmentId, initialData }: ScanPageManagerProps) {
    const [view, setView] = useState<'public' | 'tech'>('public')
    const [technician, setTechnician] = useState<{ id: string, name: string } | null>(null)

    const handleLoginSuccess = (tech: { id: string, name: string }) => {
        setTechnician(tech)
        setView('tech')
    }

    const handleVisitSuccess = () => {
        // Reload page to show new status or switch back to public with refresh logic
        setView('public')
        import('next/navigation').then((mod) => {
            window.location.reload()
        })
    }

    if (view === 'tech' && technician) {
        return (
            <div className="container max-w-lg mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button variant="ghost" className="mb-4" onClick={() => setView('public')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
                <VisitForm
                    clientId={clientId}
                    equipmentId={equipmentId}
                    technicianId={technician.id}
                    technicianName={technician.name}
                    onSuccess={handleVisitSuccess}
                    onCancel={() => setView('public')}
                />
            </div>
        )
    }

    return (
        <div className="container max-w-lg mx-auto p-4 pb-24 animate-in fade-in duration-500">
            <PublicStatus
                clientName={initialData.clientName}
                status={initialData.status}
                lastVisit={initialData.lastVisit}
            />

            <TechLoginModal
                companyId={initialData.companyId}
                onLoginSuccess={handleLoginSuccess}
            />
        </div>
    )
}
