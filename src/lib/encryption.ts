import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const algorithm = 'aes-256-gcm'
const secretKey = process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex') // Fallback for dev ONLY. 

// NOTE: In production, ENCRYPTION_KEY must be a 32-byte hex string set in env vars.

export function encryptData(text: string) {
    const iv = randomBytes(16)
    const cipher = createCipheriv(algorithm, secretKey, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')

    // Return format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decryptData(encryptedText: string) {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':')
    if (!ivHex || !authTagHex || !encryptedHex) return null

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = createDecipheriv(algorithm, secretKey, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}
