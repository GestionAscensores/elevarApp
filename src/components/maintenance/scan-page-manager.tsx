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
        companyLogo?: string | null
    }
}

export function ScanPageManager({ clientId, equipmentId, initialData }: ScanPageManagerProps) {
    const [view, setView] = useState<'public' | 'tech'>('public')
    const [technician, setTechnician] = useState<{ id: string, name: string, avatarUrl?: string | null } | null>(null)

    const handleLoginSuccess = (tech: { id: string, name: string, avatarUrl?: string | null }) => {
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
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => setView('public')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                    <div className="flex items-center gap-2">
                        {technician.avatarUrl && (
                            <img src={technician.avatarUrl} alt="Tech" className="w-8 h-8 rounded-full border border-gray-200" />
                        )}
                        <span className="font-medium text-lg text-primary">Hola, {technician.name.split(' ')[0]} 👋</span>
                    </div>
                </div>
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
                companyLogo={initialData.companyLogo}
            />

            <TechLoginModal
                companyId={initialData.companyId}
                onLoginSuccess={handleLoginSuccess}
            />
        </div>
    )
}
