'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, deleteSession } from '@/lib/session'

const AuthSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export async function login(prevState: any, formData: FormData) {
    const result = AuthSchema.safeParse(Object.fromEntries(formData))

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
        }
    }

    const { email, password } = result.data

    const user = await db.user.findUnique({
        where: { email },
        select: {
            id: true,
            cuit: true,
            password: true,
            role: true,
            subscriptionStatus: true,
            subscriptionExpiresAt: true,
            trialEndsAt: true,
            isEmailVerified: true
        }
    })

    if (!user || !user.password) {
        return {
            message: 'Credenciales inválidas.',
        }
    }

    const passwordsMatch = await bcrypt.compare(password, user.password)

    if (!passwordsMatch) {
        return {
            message: 'Credenciales inválidas.',
        }
    }

    // [FIX] Bug A: Prevent login if email is not verified
    if (!user.isEmailVerified) {
        // Option 1: Redirect to verification
        // We might need to resend the code here or rely on the user having it?
        // Let's at least block access.
        // Ideally, we redirect to a page that says "Check your email".
        // For now, we redirect to the verify page directly.
        // We need to ensure a verification code exists or generate one?
        // Let's just redirect and let the verify page handle logic (or they can click 'resend').

        // Ensure we send a new code just in case?
        // const { sendEmailVerificationCode } = await import('./verification')
        // await sendEmailVerificationCode(user.id)

        redirect('/verify-email')
    }

    await createSession(
        user.id,
        user.cuit || '',
        user.role,
        user.subscriptionStatus,
        user.trialEndsAt
    )
    redirect('/dashboard')
}

export async function register(prevState: any, formData: FormData) {
    const cuit = formData.get('cuit') as string
    const password = formData.get('password') as string
    const email = formData.get('email') as string
    const acceptTerms = formData.get('acceptTerms') === 'on'

    // Validate input manually
    const errors: { cuit?: string[], password?: string[], email?: string[], acceptTerms?: string } = {}

    // Encode CUIT as null if empty or whitespace
    const normalizedCuit = cuit?.trim() || null

    if (normalizedCuit) {
        if (normalizedCuit.length !== 11 || !/^\d+$/.test(normalizedCuit)) {
            errors.cuit = ['CUIT debe tener 11 dígitos numéricos.']
        }
    }

    if (!password || password.length < 6) {
        errors.password = ['La contraseña debe tener al menos 6 caracteres.']
    }

    if (!email || !email.includes('@')) {
        errors.email = ['Email inválido.']
    }

    if (!acceptTerms) {
        errors.acceptTerms = 'Debes aceptar la declaración jurada para continuar.'
    }

    if (Object.keys(errors).length > 0) {
        return { errors }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if user already exists (CUIT or email)
    const existingUser = await db.user.findFirst({
        where: {
            OR: [
                ...(normalizedCuit ? [{ cuit: normalizedCuit }] : []),
                { email }
            ]
        },
    })

    if (existingUser) {
        // [FIX] Bug B: If user exists but is NOT verified, allow "overwriting" (re-registering)
        if (!existingUser.isEmailVerified) {
            // Update password and info
            await db.user.update({
                where: { id: existingUser.id },
                data: {
                    cuit: normalizedCuit,
                    password: hashedPassword,
                    // Re-set trial or keep existing? Keep existing creation date but update password.
                }
            })

            // Resend code and redirect
            const { sendEmailVerificationCode } = await import('./verification')
            await sendEmailVerificationCode(existingUser.id)

            // Ensure session exists for the verify page context?
            // The logic below creates a session for the NEW user. We should do it for the EXISTING one.
            await createSession(
                existingUser.id,
                normalizedCuit || existingUser.cuit || '',
                existingUser.role,
                existingUser.subscriptionStatus,
                existingUser.trialEndsAt
            )
            redirect('/verify-email')
        }

        if (normalizedCuit && existingUser.cuit === normalizedCuit) {
            return { message: 'Ya existe un usuario con este CUIT.' }
        }
        if (existingUser.email === email) {
            return { message: 'Ya existe un usuario con este email.' }
        }
    }

    // Create user - NOT verified yet
    const newUser = await db.user.create({
        data: {
            cuit: normalizedCuit, // Pass null if empty
            email,
            password: hashedPassword,
            acceptedTerms: true,
            acceptedTermsAt: new Date(),
            isEmailVerified: false, // Not verified yet
            subscriptionStatus: 'trial',
            trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days trial
            config: {
                create: {} // Empty config
            }
        },
    })

    // Send verification code
    const { sendEmailVerificationCode } = await import('./verification')
    await sendEmailVerificationCode(newUser.id)

    // Create session but redirect to verification page
    await createSession(
        newUser.id,
        normalizedCuit || '',
        newUser.role,
        newUser.subscriptionStatus,
        newUser.trialEndsAt
    )
    redirect('/verify-email')
}

export async function logout() {
    await deleteSession()
    redirect('/login')
}

export async function cancelVerification() {
    await deleteSession()
    redirect('/register')
}
