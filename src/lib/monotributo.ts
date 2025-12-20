export type MonotributoCategory = {
    code: string
    limit: number // Annual Gross Income Limit
    servicesAllowed: boolean
    goodsAllowed: boolean
}

// Escalas Monotributo Vigentes (Agosto 2025)
// Fuente: Actualización IPC / ARCA
export const MONOTRIBUTO_SCALES: MonotributoCategory[] = [
    { code: 'A', limit: 8992597.87, servicesAllowed: true, goodsAllowed: true },
    { code: 'B', limit: 13175201.52, servicesAllowed: true, goodsAllowed: true },
    { code: 'C', limit: 18473166.15, servicesAllowed: true, goodsAllowed: true },
    { code: 'D', limit: 22934610.05, servicesAllowed: true, goodsAllowed: true },
    { code: 'E', limit: 26977793.60, servicesAllowed: true, goodsAllowed: true },
    { code: 'F', limit: 33809379.57, servicesAllowed: true, goodsAllowed: true },
    { code: 'G', limit: 40431835.35, servicesAllowed: true, goodsAllowed: true },
    { code: 'H', limit: 61344853.64, servicesAllowed: true, goodsAllowed: true }, // Límite Servicios
    { code: 'I', limit: 68664410.05, servicesAllowed: false, goodsAllowed: true },
    { code: 'J', limit: 78632948.76, servicesAllowed: false, goodsAllowed: true },
    { code: 'K', limit: 94805682.90, servicesAllowed: false, goodsAllowed: true }
]

// Nota: Los valores exactos pueden variar según la última resolución de ARCA.
// Se recomienda actualizarlos periódicamente.
// Para facturación de servicios, la categoría máxima es la H.
// Si se supera la H en servicios, se pasa al Régimen General (Responsable Inscripto).
