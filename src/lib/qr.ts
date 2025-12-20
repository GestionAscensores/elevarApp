import QRCode from 'qrcode'

export async function createQR(text: string): Promise<string> {
    try {
        return await QRCode.toDataURL(text)
    } catch (err) {
        console.error(err)
        return ''
    }
}
