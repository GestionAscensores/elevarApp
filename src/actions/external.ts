'use server'

interface InflationData {
    date: string
    value: number
    error?: string
}

export async function getIndecInflation(): Promise<InflationData | null> {
    try {
        // ID provided by user: 145.3_INGNACUAL_DICI_M_38 (Tasa de variación mensual)
        const SERIES_ID = '145.3_INGNACUAL_DICI_M_38'
        const url = `https://apis.datos.gob.ar/series/api/series/?ids=${SERIES_ID}&limit=1&sort=-indice_tiempo&format=json`

        const res = await fetch(url, {
            next: { revalidate: 24 * 60 * 60 } // Cache for 24 hours (updates monthly)
        })

        if (!res.ok) throw new Error("Failed to fetch INDEC data")

        const json = await res.json()

        // Structure check: json.data is [[date, value]]
        if (json.data && json.data.length > 0) {
            const [date, value] = json.data[0]
            return {
                date: date,
                value: Number(value)
            }
        }

        return null
    } catch (e) {
        console.error("INDEC API Error:", e)
        return null
    }
}
