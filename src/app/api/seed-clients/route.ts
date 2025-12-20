
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await verifySession()
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const clientsToImport = [
        { name: 'CUMBRE', address: 'San Martin 3251', cuit: '30596495350', ivaCondition: 'Responsable Inscripto' },
        { name: 'CENTAURO', address: 'Obispo Gelabert 2939', cuit: '30634322627', ivaCondition: 'Responsable Inscripto' },
        { name: 'SOL', address: 'San Martin 3364', cuit: '30619840174', ivaCondition: 'Responsable Inscripto' },
        { name: 'MUNDO IV', address: 'Cortada Bustamante 2215', cuit: '30686971259', ivaCondition: 'Responsable Inscripto' },
        { name: 'PROA II', address: '9 de Julio 3182', cuit: '30674603572', ivaCondition: 'Responsable Inscripto' },
        { name: 'ATAHUALPA', address: 'Urquiza 2702', cuit: '30707204024', ivaCondition: 'Responsable Inscripto' },
        { name: 'JORGE NIN', address: 'Pje. Cervantes 3023', cuit: '20121479371', ivaCondition: 'Consumidor Final' },
        // Tucuman 2638 has DNI, using generic/placeholder or skipping if strict. Using DNI as CUIT for now.
        { name: 'TUCUMAN', address: 'Tucuman 2638', cuit: '06343830', ivaCondition: 'Consumidor Final' },
        { name: 'SOL II', address: 'San Martin 3510', cuit: '30687002217', ivaCondition: 'Responsable Inscripto' },
        { name: 'Mirador de Lago', address: 'Cruz Rojo Arg 1556', cuit: '30708621354', ivaCondition: 'Consumidor Final' },
        { name: 'ALONDRAS', address: 'Eva Perón 2639', cuit: '14525735', ivaCondition: 'Consumidor Final' },
        { name: 'AUTOBICA', address: '1era Junta 2727', cuit: '30715013513', ivaCondition: 'Consumidor Final' },
        { name: 'SAN JERÓNIMO 8', address: '1ero de Mayo 2551', cuit: '307099479174', ivaCondition: 'Consumidor Final' },
        { name: 'SAN JERÓNIMO 53', address: 'San Jerónimo 1946', cuit: '00000000000', ivaCondition: 'Consumidor Final' }, // No CUIT visible
        { name: 'Sindicato de ASOEM', address: 'Urquiza 1954', cuit: '30560401880', ivaCondition: 'Exento' },
        { name: 'Panteón San Jerónimo', address: 'Blas Parera 5200', cuit: '30560401880', ivaCondition: 'Exento' }, // Same CUIT as ASOEM? Checked image: Yes, same.
        { name: 'Orestes II', address: '25 De Mayo 3380', cuit: '00000000001', ivaCondition: 'Responsable Inscripto' }, // No CUIT visible in image
        { name: 'Galí II', address: 'Eva Perón 2833', cuit: '00000000002', ivaCondition: 'Consumidor Final' }, // No CUIT visible
        { name: 'I.N.A (Fundación ARGENTINIA)', address: 'MINISTERIO DE AMBIENTE', cuit: '30676303657', ivaCondition: 'Exento' },
        { name: 'Torre 11 (El Pozo)', address: '', cuit: '30715091794', ivaCondition: 'Consumidor Final' },
        { name: 'Latino 2', address: 'San Lorenzo 2286', cuit: '30709355331', ivaCondition: 'Exento' },
        { name: 'Secretaría de Vinculación', address: 'Pje Martinez 2626', cuit: '30546670550', ivaCondition: 'Responsable Inscripto' },
        { name: 'DOMINGUEZLAB S.R.L', address: 'Martin de Moussy 41', cuit: '30713620102', ivaCondition: 'Responsable Inscripto' },
        // Batch 2
        { name: 'Las Colonias', address: 'E. Zeballos 3708', cuit: '30540938322', ivaCondition: 'Responsable Inscripto' },
        { name: 'Diagnóstico por imágenes', address: 'Junin 2474', cuit: '30654705581', ivaCondition: 'Responsable Inscripto' },
        { name: 'Diagnóstico por Imágenes (2)', address: 'G. López 2876', cuit: '30654705581', ivaCondition: 'Responsable Inscripto' },
        { name: 'Hermes III', address: '1era Junta 2507', cuit: '30543661364', ivaCondition: 'Consumidor Final' },
        { name: 'BALMORAL', address: 'Junín 2661', cuit: '30692364550', ivaCondition: 'Consumidor Final' },
        { name: 'Atalaya', address: 'Belgrano 2625', cuit: '30687005429', ivaCondition: 'Consumidor Final' },
        { name: 'Viajantes II', address: '25 de Mayo 1641', cuit: '30609529659', ivaCondition: 'Consumidor Final' },
        { name: 'SAN JERÓNIMO 6', address: 'San Martín 1947', cuit: '30640851755', ivaCondition: 'Consumidor Final' },
        { name: 'SAN JERÓNIMO 12', address: '1ero de Mayo 1376', cuit: '30707431055', ivaCondition: 'Consumidor Final' },
        { name: 'SAN JERONIMO 44', address: '25 de Mayo 2059', cuit: '00000000003', ivaCondition: 'Consumidor Final' }, // No CUIT
        { name: 'Bs As Palace', address: 'San Martin 1709', cuit: '30576642136', ivaCondition: 'Consumidor Final' },
        { name: 'Güemes', address: '25 de Mayo 2025', cuit: '30621698911', ivaCondition: 'Consumidor Final' },
        { name: 'SAN JERONIMO II', address: 'San Jerónimo 2033', cuit: '30621719730', ivaCondition: 'Consumidor Final' },
        { name: 'Arco', address: 'Corrientes 2651', cuit: '30709848670', ivaCondition: 'Consumidor Final' },
        { name: 'CAM XIX', address: 'Corrientes 2608', cuit: '30708621346', ivaCondition: 'Consumidor Final' },
        { name: 'ASTEOM', address: 'Rivadavia 1425', cuit: '30559828617', ivaCondition: 'Exento' },
        { name: 'Sagrado Corazón de Jesús', address: 'Rafaela', cuit: '30538683368', ivaCondition: 'Exento' },
        { name: 'Panteón Lourdes', address: 'Blas Parera 5200', cuit: '30538683368', ivaCondition: 'Exento' },
        { name: 'Torre 1', address: 'Las Flores II', cuit: '30641886765', ivaCondition: 'Consumidor Final' },
        { name: 'Torre 2', address: 'Las Flores II', cuit: '30708984309', ivaCondition: 'Consumidor Final' },
        { name: 'Torre 7', address: 'Las Flores II', cuit: '30706635587', ivaCondition: 'Consumidor Final' }
    ]

    let successCount = 0
    let skippedCount = 0

    for (const c of clientsToImport) {
        // Check if exists
        const exists = await db.client.findFirst({
            where: { userId: session.userId, cuit: c.cuit }
        })

        if (!exists) {
            await db.client.create({
                data: {
                    userId: session.userId,
                    name: c.name,
                    cuit: c.cuit,
                    address: c.address,
                    ivaCondition: c.ivaCondition,
                    email: ''
                }
            })
            successCount++
        } else {
            skippedCount++
        }
    }

    return new NextResponse(`Import Finished. Created: ${successCount}, Skipped: ${skippedCount}. <a href="/dashboard/clients">Go to Clients</a>`, {
        headers: { 'Content-Type': 'text/html' }
    })
}
