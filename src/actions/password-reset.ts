'use server'

import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/mail'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const ResetSchema = z.object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
})

/**
 * Solicita el reseteo de contraseña
 */
export async function requestPasswordReset(email: string) {
    if (!email || !email.includes('@')) {
        return { error: 'Email inválido' }
    }

    try {
        const user = await db.user.findUnique({
            where: { email },
            select: { id: true, email: true }
        })

        // Por seguridad, si el usuario no existe, no decimos nada
        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`)
            return { success: true }
        }

        // Generar token seguro
        const token = randomBytes(32).toString('hex')
        const expires = new Date()
        expires.setHours(expires.getHours() + 1) // 1 hora de validez

        // Guardar token en VerificationToken (reutilizamos esta tabla o creamos una nueva)
        // Schema tiene VerificationToken con [identifier, token]
        // Podemos usar identifier=email para esto

        // Primero borrar tokens viejos para este email
        await db.verificationToken.deleteMany({
            where: { identifier: email }
        })

        await db.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        })

        // Enviar email
        await sendPasswordResetEmail(email, token)

        return { success: true }
    } catch (error) {
        console.error('Error requesting password reset:', error)
        return { error: 'Ocurrió un error al procesar la solicitud' }
    }
}

/**
 * Resetea la contraseña usando el token
 */
export async function resetPassword(token: string, formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Validar inputs
    const result = ResetSchema.safeParse({ password, confirmPassword })

    if (!result.success) {
        return { error: result.error.errors[0].message }
    }

    try {
        // Buscar token
        const verificationToken = await db.verificationToken.findFirst({
            where: { token }
        })

        if (!verificationToken) {
            return { error: 'Token inválido o expirado' }
        }

        // Verificar expiración
        if (verificationToken.expires < new Date()) {
            return { error: 'El token ha expirado. Solicita uno nuevo.' }
        }

        // Verificar usuario
        const user = await db.user.findUnique({
            where: { email: verificationToken.identifier }
        })

        if (!user) {
            return { error: 'Usuario no encontrado' }
        }

        // Hash nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10)

        // Actualizar usuario
        await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        })

        // Borrar token
        await db.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: verificationToken.identifier,
                    token: token
                }
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Error resetting password:', error)
        return { error: 'Ocurrió un error al restablecer la contraseña' }
    }
}
