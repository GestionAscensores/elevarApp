import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET || 'default-secret-key-change-me'
const encodedKey = new TextEncoder().encode(secretKey)

type SessionPayload = {
    userId: string
    cuit: string
    role: string
    subscriptionStatus?: string | null
    trialEndsAt?: string | null
    expiresAt: Date
}

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        return null
    }
}

export async function createSession(
    userId: string,
    cuit: string,
    role: string,
    subscriptionStatus: string | null = 'trial',
    trialEndsAt: Date | null | undefined = null
) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    // Convert dates to ISO strings for JSON compatibility in JWT
    const session = await encrypt({
        userId,
        cuit,
        role,
        subscriptionStatus,
        trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
        expiresAt
    })
    const cookieStore = await cookies()

    cookieStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })
}

export async function verifySession() {
    // Try NextAuth first (for OAuth users like Google)
    try {
        const { auth } = await import('./auth')
        const session = await auth()

        if (session?.user) {
            return {
                isAuth: true,
                userId: session.user.id!,
                cuit: (session.user as any).cuit || '',
                role: session.user.role || 'USER',
                subscriptionStatus: (session.user as any).subscriptionStatus || null,
                trialEndsAt: (session.user as any).trialEndsAt ? new Date((session.user as any).trialEndsAt) : null
            }
        }
    } catch (error) {
        console.log('NextAuth session not found, trying custom session...')
    }

    // Fallback to custom session (for CUIT/password users)
    const cookieStore = await cookies()
    const cookie = cookieStore.get('session')?.value
    const session = await decrypt(cookie)

    if (!session?.userId) {
        return null
    }

    return {
        isAuth: true,
        userId: String(session.userId),
        role: String(session.role),
        cuit: String(session.cuit),
        subscriptionStatus: session.subscriptionStatus as string | null,
        trialEndsAt: session.trialEndsAt ? new Date(session.trialEndsAt as string) : null
    }
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}
