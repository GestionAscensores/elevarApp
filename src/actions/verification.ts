'use server'

import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/mail'
import { verifySession } from '@/lib/session'

/**
 * Genera un código aleatorio de 6 dígitos
 */
function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Envía un código de verificación al email del usuario
 */
export async function sendEmailVerificationCode(userId: string) {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, isEmailVerified: true }
        })

        if (!user || !user.email) {
            return { error: 'Usuario no encontrado o sin email' }
        }

        if (user.isEmailVerified) {
            return { error: 'El email ya está verificado' }
        }

        // Generar código y fecha de expiración (15 minutos)
        const code = generateVerificationCode()
        const expires = new Date()
        expires.setMinutes(expires.getMinutes() + 15)

        // Guardar código en BD
        await db.user.update({
            where: { id: userId },
            data: {
                emailVerificationCode: code,
                emailVerificationExpires: expires
            }
        })

        // Enviar email
        await sendVerificationEmail(user.email, code, user.name || undefined)

        return { success: true }
    } catch (error) {
        console.error('Error sending verification code:', error)
        return { error: 'Error al enviar código de verificación' }
    }
}

/**
 * Verifica el código ingresado por el usuario
 */
export async function verifyEmailCode(code: string) {
    try {
        const session = await verifySession()
        if (!session) return { error: 'No autenticado' }
        const userId = session.userId

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                emailVerificationCode: true,
                emailVerificationExpires: true,
                isEmailVerified: true
            }
        })

        if (!user) {
            return { error: 'Usuario no encontrado' }
        }

        if (user.isEmailVerified) {
            return { error: 'El email ya está verificado' }
        }

        if (!user.emailVerificationCode) {
            return { error: 'No hay código de verificación pendiente' }
        }

        if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            return { error: 'El código ha expirado. Solicita uno nuevo' }
        }

        if (user.emailVerificationCode !== code) {
            return { error: 'Código incorrecto' }
        }

        // Código válido - activar cuenta
        await db.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
                emailVerificationCode: null,
                emailVerificationExpires: null
            }
        })

        // Eliminar sesión actual para que re-login con token actualizado
        const { deleteSession } = await import('@/lib/session')
        await deleteSession()

        return { success: true }
    } catch (error) {
        console.error('Error verifying code:', error)
        return { error: 'Error al verificar código' }
    }
}

/**
 * Obtiene el estado de verificación del usuario
 */
export async function getVerificationStatus(userId: string) {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                isEmailVerified: true,
                emailVerificationExpires: true
            }
        })

        if (!user) {
            return { error: 'Usuario no encontrado' }
        }

        return {
            email: user.email,
            isVerified: user.isEmailVerified,
            hasCode: !!user.emailVerificationExpires,
            codeExpires: user.emailVerificationExpires
        }
    } catch (error) {
        console.error('Error getting verification status:', error)
        return { error: 'Error al obtener estado' }
    }
}

/**
 * Obtiene el ID del usuario actual desde la sesión
 * Esta función puede ser llamada desde componentes cliente
 */
export async function getCurrentUserId() {
    try {
        const session = await verifySession()
        if (!session) {
            return { error: 'No autenticado' }
        }
        return { userId: session.userId }
    } catch (error) {
        console.error('Error getting current user:', error)
        return { error: 'Error al obtener usuario' }
    }
}
