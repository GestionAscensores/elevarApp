
/**
 * Generates the QR Code Data required by AFIP (RG 4291/18).
 * The data must be a JSON object encoded in Base64.
 * URL format: https://www.afip.gob.ar/fe/qr/?p=BASE64_JSON
 */

// Production URL: https://www.afip.gob.ar/fe/qr/?p=
// Testing URL: https://www.afip.gob.ar/fe/qr/?p= (Same URL structure)

type QRData = {
    ver: number         // 1
    fecha: string       // YYYY-MM-DD
    cuit: number        // CUIT Emisor
    ptoVta: number
    tipoCmp: number
    nroCmp: number
    importe: number
    moneda: string      // "PES"
    ctz: number         // 1
    tipoDocRec: number  // 80
    nroDocRec: number
    tipoCodAut: string  // "E" for CAE
    codAut: number      // CAE
}

export function generateAfipQrUrl(data: QRData): string {
    const jsonString = JSON.stringify(data)
    const base64Data = Buffer.from(jsonString).toString('base64')
    return `https://www.afip.gob.ar/fe/qr/?p=${base64Data}`
}
