"use client"

import * as React from "react"

type Palette = "blue" | "navy" | "sunset" | "volcan" | "forest"

interface PaletteProviderState {
    palette: Palette
    setPalette: (palette: Palette) => void
}

const initialState: PaletteProviderState = {
    palette: "blue",
    setPalette: () => null,
}

const PaletteProviderContext = React.createContext<PaletteProviderState>(initialState)

export function PaletteProvider({
    children,
    defaultPalette = "blue",
    storageKey = "elevar-ui-palette",
    ...props
}: {
    children: React.ReactNode
    defaultPalette?: Palette
    storageKey?: string
}) {
    const [palette, setPalette] = React.useState<Palette>(
        () => (typeof window !== "undefined" ? (localStorage.getItem(storageKey) as Palette) : defaultPalette) || defaultPalette
    )

    React.useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("theme-blue", "theme-navy", "theme-sunset", "theme-volcan", "theme-forest")
        root.classList.add(`theme-${palette}`)
        // Also set data attribute for easier styling if needed
        root.setAttribute("data-theme", palette)
    }, [palette])

    const value = {
        palette,
        setPalette: (palette: Palette) => {
            localStorage.setItem(storageKey, palette)
            setPalette(palette)
        },
    }

    return (
        <PaletteProviderContext.Provider {...props} value={value}>
            {children}
        </PaletteProviderContext.Provider>
    )
}

export const usePalette = () => {
    const context = React.useContext(PaletteProviderContext)
    if (context === undefined)
        throw new Error("usePalette must be used within a PaletteProvider")
    return context
}
