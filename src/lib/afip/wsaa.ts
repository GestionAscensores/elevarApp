import forge from 'node-forge'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import { decryptData } from '@/lib/encryption'
import { db } from '@/lib/db'

// URLs
const WSAA_URL_TEST = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms'
const WSAA_URL_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms'

const WSFE_SERVICE = 'wsfe'

export async function getAfipToken(userId: string) {
    const userConfig = await db.userConfig.findUnique({ where: { userId } })
    if (!userConfig || !userConfig.keyEncrypted || !userConfig.certEncrypted) {
        throw new Error('Faltan credenciales AFIP (Certificado o Clave Privada)')
    }

    // Check if token is valid (expired?)
    if (userConfig.afipToken && userConfig.afipSign && userConfig.afipExpiration) {
        if (new Date() < userConfig.afipExpiration) {
            return {
                token: userConfig.afipToken,
                sign: userConfig.afipSign
            }
        }
    }

    // Decrypt credentials
    const privateKeyTitle = decryptData(userConfig.keyEncrypted)
    const certificate = decryptData(userConfig.certEncrypted)

    if (!privateKeyTitle || !certificate) throw new Error('Error al desencriptar credenciales')

    // Create Login Ticket Request (TRA)
    const tra = `<?xml version="1.0" encoding="UTF-8"?>
    <loginTicketRequest version="1.0">
        <header>
            <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
            <generationTime>${new Date(Date.now() - 600000).toISOString()}</generationTime>
            <expirationTime>${new Date(Date.now() + 600000).toISOString()}</expirationTime>
        </header>
        <service>${WSFE_SERVICE}</service>
    </loginTicketRequest>`

    // Sign TRA (CMS/PKCS#7)
    // We use node-forge to create the CMS
    const p7 = forge.pkcs7.createSignedData()
    p7.content = forge.util.createBuffer(tra, 'utf8')

    const certObj = forge.pki.certificateFromPem(certificate)
    const keyObj = forge.pki.privateKeyFromPem(privateKeyTitle)

    p7.addCertificate(certObj)
    p7.addSigner({
        key: keyObj,
        certificate: certObj,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [{
            type: forge.pki.oids.contentType,
            value: forge.pki.oids.data,
        }, {
            type: forge.pki.oids.messageDigest,
        }, {
            type: forge.pki.oids.signingTime,
        }]
    })

    p7.sign({ detached: false })
    const cms = forge.pkcs7.messageToPem(p7)
        .replace(/-----BEGIN PKCS7-----/, '')
        .replace(/-----END PKCS7-----/, '')
        .replace(/\n/g, '')

    // SOAP Request
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dnew.com.ar">
        <soapenv:Header/>
        <soapenv:Body>
            <wsaa:loginCms>
                <in0>${cms}</in0>
            </wsaa:loginCms>
        </soapenv:Body>
    </soapenv:Envelope>`

    // URL based on User Config
    const isProduction = userConfig.afipEnvironment === 'PRODUCTION'
    const URL = isProduction ? WSAA_URL_PROD : WSAA_URL_TEST

    try {
        const { data } = await axios.post(URL, soapRequest, {
            headers: {
                'Content-Type': 'text/xml',
                'SOAPAction': ''
            }
        })

        const result = await parseStringPromise(data)
        const loginCmsReturn = result['soapenv:Envelope']['soapenv:Body'][0]['loginCmsResponse'][0]['loginCmsReturn'][0]

        const loginTicketResponse = await parseStringPromise(loginCmsReturn)
        const credentials = loginTicketResponse['loginTicketResponse']['credentials'][0]
        const token = credentials['token'][0]
        const sign = credentials['sign'][0]
        const header = loginTicketResponse['loginTicketResponse']['header'][0]
        const expirationTime = header['expirationTime'][0]

        // Cache in DB
        await db.userConfig.update({
            where: { userId },
            data: {
                afipToken: token,
                afipSign: sign,
                afipExpiration: new Date(expirationTime)
            }
        })

        return { token, sign }

    } catch (error: any) {
        console.error('AFIP WSAA Error:', error.response?.data || error.message)
        throw new Error('Error al conectar con AFIP (Autenticación)')
    }
}
