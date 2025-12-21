"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { usePalette } from "@/components/providers/palette-provider"
import { Button } from "@/components/ui/button"
import { Check, Palette, Moon, Sun, Laptop, Flame, Trees, Anchor, Sunset } from "lucide-react"

export function ThemeSelector() {
    const { theme, setTheme } = useTheme()
    const { palette, setPalette } = usePalette()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const modes = [
        { id: 'light', name: 'Claro', icon: Sun },
        { id: 'dark', name: 'Oscuro', icon: Moon },
        { id: 'system', name: 'Sistema', icon: Laptop },
    ]

    const palettes = [
        { id: 'blue', name: 'Original', color: 'bg-blue-600', icon: Palette },
        { id: 'navy', name: 'Navy', color: 'bg-[#1B4079]', icon: Anchor },
        { id: 'sunset', name: 'Sunset', color: 'bg-[#C06C84]', icon: Sunset },
        { id: 'volcan', name: 'Volcán', color: 'bg-[#4A144E]', icon: Flame },
        { id: 'forest', name: 'Bosque', color: 'bg-[#1b4d2e]', icon: Trees },
    ]

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Modo (Brillo)</label>
                <div className="flex flex-wrap gap-2">
                    {modes.map((m) => {
                        const isActive = theme === m.id
                        return (
                            <Button
                                key={m.id}
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                                className={`gap-2 ${isActive ? '' : 'text-muted-foreground'}`}
                                onClick={() => setTheme(m.id)}
                            >
                                <m.icon className="h-4 w-4" />
                                {m.name}
                            </Button>
                        )
                    })}
                </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Paleta de Colores (Estilo)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {palettes.map((p) => {
                        const isActive = palette === p.id
                        // Type assertion since palette string comes from localStorage/context
                        const isSelected = isActive
                        return (
                            <Button
                                key={p.id}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className={`justify-start gap-2 ${isSelected ? '' : 'text-muted-foreground'}`}
                                onClick={() => setPalette(p.id as any)}
                            >
                                <div className={`h-3 w-3 rounded-full ${p.color} border border-white/20 shadow-sm`} />
                                <span>{p.name}</span>
                                {isSelected && <Check className="ml-auto h-3 w-3" />}
                            </Button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
