import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import { getAfipToken } from './wsaa'
import { db } from '@/lib/db'

const WSFE_URL_TEST = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
const WSFE_URL_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'

// Types
type InvoiceData = {
    cbteTipo: number // 1=Factura A, 6=Factura B, 11=Factura C
    ptoVta: number
    cbteNro: number
    cbteFch: string // YYYYMMDD
    impTotal: number
    impTotConc: number
    impNeto: number
    impOpEx: number
    impTrib: number
    impIVA: number
    monId: string // 'PES' | 'DOL'
    monCotiz: number
    docTipo: number // 80=CUIT, 96=DNI, 99=Consumidor Final
    docNro: string
    ivas: {
        id: number // 5=21%, 4=10.5%, 3=0%
        baseImp: number
        importe: number
    }[]
    concept: number // 1, 2, 3
    fchServDesde?: string
    fchServHasta?: string
    fchVtoPago?: string
    condicionIvaReceptorId?: number
    opcionales?: { id: number, valor: string }[]
    cbtesAsoc?: { Tipo: number, PtoVta: number, Nro: number }[]
}

export async function getLastVoucher(userId: string, ptoVta: number, cbteTipo: number) {
    const { token, sign } = await getAfipToken(userId)
    const user = await db.user.findUnique({ where: { id: userId } })
    const url = process.env.AFIP_ENV === 'production' ? WSFE_URL_PROD : WSFE_URL_TEST

    if (!user) throw new Error("Usuario no encontrado")

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
       <soapenv:Header/>
       <soapenv:Body>
          <ar:FECompUltimoAutorizado>
             <ar:Auth>
                <ar:Token>${token}</ar:Token>
                <ar:Sign>${sign}</ar:Sign>
                <ar:Cuit>${user.cuit}</ar:Cuit>
             </ar:Auth>
             <ar:PtoVta>${ptoVta}</ar:PtoVta>
             <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
          </ar:FECompUltimoAutorizado>
       </soapenv:Body>
    </soapenv:Envelope>`

    try {
        const { data } = await axios.post(url, soapRequest, {
            headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado' }
        })
        const result = await parseStringPromise(data)
        const response = result['soap:Envelope']['soap:Body'][0]['FECompUltimoAutorizadoResponse'][0]['FECompUltimoAutorizadoResult'][0]

        if (response.Errors) {
            throw new Error(response.Errors[0].Err[0].Msg[0])
        }

        return Number(response.CbteNro[0])
    } catch (error: any) {
        console.error('AFIP WSFE Error (LastVoucher):', error.message)
        throw new Error('Error al obtener último comprobante')
    }
}

export async function authorizeInvoice(userId: string, invoice: InvoiceData) {
    const { token, sign } = await getAfipToken(userId)
    const user = await db.user.findUnique({ where: { id: userId } })
    const url = process.env.AFIP_ENV === 'production' ? WSFE_URL_PROD : WSFE_URL_TEST

    if (!user) throw new Error("Usuario no encontrado")

    // Construct IVA Array XML
    let ivaXml = ''
    if (invoice.ivas.length > 0) {
        ivaXml = '<ar:Iva>' + invoice.ivas.map(iva => `
            <ar:AlicIva>
                <ar:Id>${iva.id}</ar:Id>
                <ar:BaseImp>${iva.baseImp.toFixed(2)}</ar:BaseImp>
                <ar:Importe>${iva.importe.toFixed(2)}</ar:Importe>
            </ar:AlicIva>
        `).join('') + '</ar:Iva>'
    }

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
       <soapenv:Header/>
       <soapenv:Body>
          <ar:FECAESolicitar>
             <ar:Auth>
                <ar:Token>${token}</ar:Token>
                <ar:Sign>${sign}</ar:Sign>
                <ar:Cuit>${user.cuit}</ar:Cuit>
             </ar:Auth>
             <ar:FeCAEReq>
                <ar:FeCabReq>
                   <ar:CantReg>1</ar:CantReg>
                   <ar:PtoVta>${invoice.ptoVta}</ar:PtoVta>
                   <ar:CbteTipo>${invoice.cbteTipo}</ar:CbteTipo>
                </ar:FeCabReq>
                <ar:FeDetReq>
                   <ar:FECAEDetRequest>
                      <ar:Concepto>${invoice.concept}</ar:Concepto>
                      <ar:DocTipo>${invoice.docTipo}</ar:DocTipo>
                      <ar:DocNro>${invoice.docNro}</ar:DocNro>
                      <ar:CbteDesde>${invoice.cbteNro}</ar:CbteDesde>
                      <ar:CbteHasta>${invoice.cbteNro}</ar:CbteHasta>
                      <ar:CbteFch>${invoice.cbteFch}</ar:CbteFch>
                      <ar:ImpTotal>${invoice.impTotal.toFixed(2)}</ar:ImpTotal>
                      <ar:ImpTotConc>${invoice.impTotConc.toFixed(2)}</ar:ImpTotConc>
                      <ar:ImpNeto>${invoice.impNeto.toFixed(2)}</ar:ImpNeto>
                      <ar:ImpOpEx>${invoice.impOpEx.toFixed(2)}</ar:ImpOpEx>
                      <ar:ImpTrib>${invoice.impTrib.toFixed(2)}</ar:ImpTrib>
                      <ar:ImpIVA>${invoice.impIVA.toFixed(2)}</ar:ImpIVA>
                      ${invoice.concept !== 1 ? `
                      <ar:FchServDesde>${invoice.fchServDesde}</ar:FchServDesde>
                      <ar:FchServHasta>${invoice.fchServHasta}</ar:FchServHasta>
                      <ar:FchVtoPago>${invoice.fchVtoPago}</ar:FchVtoPago>` : ''}
                      <ar:MonId>${invoice.monId}</ar:MonId>
                      <ar:MonCotiz>${invoice.monCotiz}</ar:MonCotiz>
                      ${invoice.cbtesAsoc && invoice.cbtesAsoc.length > 0 ? `
                      <ar:CbtesAsoc>
                        ${invoice.cbtesAsoc.map(cbte => `
                        <ar:CbteAsoc>
                            <ar:Tipo>${cbte.Tipo}</ar:Tipo>
                            <ar:PtoVta>${cbte.PtoVta}</ar:PtoVta>
                            <ar:Nro>${cbte.Nro}</ar:Nro>
                        </ar:CbteAsoc>`).join('')}
                      </ar:CbtesAsoc>` : ''}
                      ${invoice.condicionIvaReceptorId ? `<ar:CondicionIVAReceptorId>${invoice.condicionIvaReceptorId}</ar:CondicionIVAReceptorId>` : ''}
                      ${invoice.opcionales && invoice.opcionales.length > 0 ? `
                      <ar:Opcionales>
                        ${invoice.opcionales.map(op => `
                        <ar:Opcional>
                            <ar:Id>${op.id}</ar:Id>
                            <ar:Valor>${op.valor}</ar:Valor>
                        </ar:Opcional>`).join('')}
                      </ar:Opcionales>` : ''}
                      ${ivaXml}
                   </ar:FECAEDetRequest>
                </ar:FeDetReq>
             </ar:FeCAEReq>
          </ar:FECAESolicitar>
       </soapenv:Body>
    </soapenv:Envelope>`

    try {
        const { data } = await axios.post(url, soapRequest, {
            headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECAESolicitar' }
        })
        const result = await parseStringPromise(data)
        const response = result['soap:Envelope']['soap:Body'][0]['FECAESolicitarResponse'][0]['FECAESolicitarResult'][0]

        // Check for header errors
        if (response.Errors) {
            const errorMsg = response.Errors[0].Err[0].Msg[0]
            throw new Error(errorMsg)
        }

        const detResponse = response.FeDetResp[0].FECAEDetResponse[0]

        if (detResponse.Observaciones) {
            const obs = detResponse.Observaciones[0].Obs[0].Msg[0]
            // Sometimes Obs are just warnings, but if CAE is empty it's an error.
        }

        const cae = detResponse.CAE[0]
        const caeFchVto = detResponse.CAEFchVto[0]
        const resultado = detResponse.Resultado[0] // A=Aprobado, R=Rechazado

        if (resultado === 'R') {
            let errorMsg = 'Factura Rechazada por AFIP'
            if (detResponse.Observaciones) {
                const obs = detResponse.Observaciones[0].Obs
                const messages = obs.map((o: any) => `(${o.Code[0]}) ${o.Msg[0]}`).join('. ')
                errorMsg += `: ${messages}`
            }
            throw new Error(errorMsg)
        }

        return {
            cae,
            caeFchVto,
            resultado
        }

    } catch (error: any) {
        console.error('AFIP WSFE Error (Authorize):', error.message)
        throw new Error(error.message || 'Error al autorizar factura')
    }
}

export async function getInvoiceDetails(userId: string, ptoVta: number, cbteTipo: number, cbteNro: number) {
    const { token, sign } = await getAfipToken(userId)
    const user = await db.user.findUnique({ where: { id: userId } })
    const url = process.env.AFIP_ENV === 'production' ? WSFE_URL_PROD : WSFE_URL_TEST

    if (!user) throw new Error("Usuario no encontrado")

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
       <soapenv:Header/>
       <soapenv:Body>
          <ar:FECompConsultar>
             <ar:Auth>
                <ar:Token>${token}</ar:Token>
                <ar:Sign>${sign}</ar:Sign>
                <ar:Cuit>${user.cuit}</ar:Cuit>
             </ar:Auth>
             <ar:FeCompConsReq>
                <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
                <ar:CbteNro>${cbteNro}</ar:CbteNro>
                <ar:PtoVta>${ptoVta}</ar:PtoVta>
             </ar:FeCompConsReq>
          </ar:FECompConsultar>
       </soapenv:Body>
    </soapenv:Envelope>`

    try {
        const { data } = await axios.post(url, soapRequest, {
            headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECompConsultar' }
        })
        const result = await parseStringPromise(data)
        const response = result['soap:Envelope']['soap:Body'][0]['FECompConsultarResponse'][0]['FECompConsultarResult'][0]

        if (response.Errors) {
            throw new Error(response.Errors[0].Err[0].Msg[0])
        }

        const comp = response.ResultGet[0]

        return {
            cbteTipo: Number(comp.CbteTipo[0]),
            cbteNro: Number(comp.CbteNro[0]),
            ptoVta: Number(comp.PtoVta[0]),
            cbteFch: comp.CbteFch[0],
            impTotal: Number(comp.ImpTotal[0]),
            impNeto: Number(comp.ImpNeto[0]),
            impIVA: Number(comp.ImpIVA[0]),
            docTipo: Number(comp.DocTipo[0]),
            docNro: comp.DocNro[0],
            cae: comp.CodAutorizacion[0],
            caeFchVto: comp.FchVto[0],
            concepto: Number(comp.Concepto[0]),
            fchServDesde: comp.FchServDesde ? comp.FchServDesde[0] : null,
            fchServHasta: comp.FchServHasta ? comp.FchServHasta[0] : null
        }
    } catch (error: any) {
        console.error('ARCA WSFE Error (FECompConsultar):', error.message)
        throw new Error('Error al consultar comprobante')
    }
}
