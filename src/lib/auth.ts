import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    debug: true,
    trustHost: true,
    secret: process.env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(db),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: "Email/Contraseña",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await db.user.findUnique({
                    where: { email: credentials.email as string },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        password: true,
                        role: true,
                        subscriptionStatus: true,
                        subscriptionExpiresAt: true,
                        trialEndsAt: true, // Added
                        isEmailVerified: true,
                        isActive: true
                    }
                })

                if (!user || !user.password) return null

                if (!user.isActive) {
                    console.log(`❌ Login attempt by inactive user: ${user.email}`)
                    return null
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!passwordMatch) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    subscriptionStatus: user.subscriptionStatus,
                    subscriptionExpiresAt: user.subscriptionExpiresAt,
                    trialEndsAt: user.trialEndsAt,
                    isEmailVerified: user.isEmailVerified
                }
            }
        })
    ],
    // ... events ...
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }) {
            // Check if user is active (for OAuth specifically, though authorizes covers credentials)
            // 1. Initial Sign In
            if (user) {
                token.sub = user.id
                token.role = user.role
                token.subscriptionStatus = user.subscriptionStatus
                // ... (keep existing logic) ...
            }
            return true
        },
        async jwt({ token, user, account, profile, trigger }) {
            // 1. Initial Sign In
            if (user) {
                token.sub = user.id
                token.role = user.role
                token.subscriptionStatus = user.subscriptionStatus
                token.subscriptionExpiresAt = user.subscriptionExpiresAt?.toISOString()
                // @ts-ignore
                token.trialEndsAt = user.trialEndsAt?.toISOString()
                // @ts-ignore
                token.isEmailVerified = user.isEmailVerified || !!user.emailVerified
                return token
            }

            // 2. OAuth First Login
            if (profile?.email && !token.role) {
                try {
                    const dbUser = await db.user.findUnique({
                        where: { email: profile.email as string },
                        select: { id: true, role: true, subscriptionStatus: true, subscriptionExpiresAt: true, trialEndsAt: true }
                    })
                    if (dbUser) {
                        token.sub = dbUser.id
                        token.role = dbUser.role
                        token.subscriptionStatus = dbUser.subscriptionStatus
                        token.subscriptionExpiresAt = dbUser.subscriptionExpiresAt?.toISOString()
                        // @ts-ignore
                        token.trialEndsAt = dbUser.trialEndsAt?.toISOString()
                    }
                } catch (e) { console.error("Error finding user in JWT", e) }
            }

            // 3. Refresh
            if (token.sub) {
                try {
                    const dbUser = await db.user.findUnique({
                        where: { id: token.sub },
                        select: { role: true, subscriptionStatus: true, subscriptionExpiresAt: true, trialEndsAt: true, isEmailVerified: true }
                    })
                    if (dbUser) {
                        token.role = dbUser.role
                        token.subscriptionStatus = dbUser.subscriptionStatus
                        token.subscriptionExpiresAt = dbUser.subscriptionExpiresAt?.toISOString()
                        // @ts-ignore
                        token.trialEndsAt = dbUser.trialEndsAt?.toISOString()
                        // @ts-ignore
                        token.isEmailVerified = dbUser.isEmailVerified
                    }
                } catch (e) {
                    console.error("Error refreshing token data", e)
                }
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub!
                // @ts-ignore
                session.user.role = token.role as string
                // @ts-ignore
                session.user.subscriptionStatus = token.subscriptionStatus as string
                // @ts-ignore
                session.user.subscriptionExpiresAt = token.subscriptionExpiresAt as string | null
                // @ts-ignore
                session.user.trialEndsAt = token.trialEndsAt as string | null
                // @ts-ignore
                session.user.isEmailVerified = token.isEmailVerified as boolean
            }
            return session
        },
    }
})

/**
 * Alternative getSession for Server Components
 */
export async function getSession() {
    try {
        const cookieStore = await cookies()
        // Try both standard and secure cookie names
        const sessionToken = cookieStore.get('authjs.session-token')?.value ||
            cookieStore.get('__Secure-authjs.session-token')?.value ||
            cookieStore.get('next-auth.session-token')?.value ||
            cookieStore.get('__Secure-next-auth.session-token')?.value


        if (!sessionToken) {
            return null
        }

        // Use the auth which works with the full config (node)
        const session = await auth()
        return session
    } catch (error) {
        console.error("Error getting session:", error)
        return null
    }
}
