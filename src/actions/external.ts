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
            next: { revalidate: 3600 }, // Revalidate every hour
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        })

        if (!res.ok) throw new Error(`Status: ${res.status}`)

        const json = await res.json()

        // Structure check: json.data is [[date, value]]
        if (json.data && json.data.length > 0) {
            const [date, value] = json.data[0]
            return {
                date: date,
                value: Number(value)
            }
        }

        throw new Error("Empty data")
    } catch (e) {
        console.warn("INDEC API Warning (Using Fallback):", e instanceof Error ? e.message : e)

        // Fallback: Use previous month date context for reference data
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)

        return {
            date: lastMonth.toISOString(),
            value: 2.7,
            error: "Datos de respaldo (API Offline)"
        }
    }
}
