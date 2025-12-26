
import { ScanInterface } from "@/components/inventory/scan-interface"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Escáner de Inventario | Elevar App",
    description: "Gestión rápida de stock mediante código de barras",
}

export default function InventoryScanPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Escáner de Inventario</h1>
                <p className="text-muted-foreground">
                    Gestiona el stock rápidamente usando la cámara de tu dispositivo
                </p>
            </div>

            <ScanInterface />
        </div>
    )
}
