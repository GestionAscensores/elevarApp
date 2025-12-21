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
    adapter: PrismaAdapter(db),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
                        isEmailVerified: true
                    }
                })

                if (!user || !user.password) return null

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
                    isEmailVerified: user.isEmailVerified
                }
            }
        })
    ],
    events: {
        async createUser({ user }) {
            console.log("🆕 User created, setting trial period for:", user.email)
            if (user.id) {
                const trialEndsAt = new Date()
                trialEndsAt.setDate(trialEndsAt.getDate() + 15) // 15 days trial
                try {
                    await db.user.update({ where: { id: user.id }, data: { trialEndsAt, subscriptionStatus: 'trial' } })
                } catch (error) {
                    console.error("Error setting trial for new user:", error)
                }
            }
        }
    },
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, account, profile, trigger }) {
            // 1. Initial Sign In (Credentials or OAuth)
            if (user) {
                token.sub = user.id
                token.role = user.role
                token.subscriptionStatus = user.subscriptionStatus
                token.subscriptionExpiresAt = user.subscriptionExpiresAt?.toISOString()
                // @ts-ignore
                token.isEmailVerified = user.isEmailVerified || !!user.emailVerified
                return token
            }

            // 2. OAuth First Login (if user obj missing but profile present)
            if (profile?.email && !token.role) {
                try {
                    const dbUser = await db.user.findUnique({
                        where: { email: profile.email as string },
                        select: { id: true, role: true, subscriptionStatus: true, subscriptionExpiresAt: true }
                    })
                    if (dbUser) {
                        token.sub = dbUser.id
                        token.role = dbUser.role
                        token.subscriptionStatus = dbUser.subscriptionStatus
                        token.subscriptionExpiresAt = dbUser.subscriptionExpiresAt?.toISOString()
                    }
                } catch (e) { console.error("Error finding user in JWT", e) }
            }

            // 3. Refresh (accessing DB to keep data fresh)
            if (token.sub) {
                try {
                    const dbUser = await db.user.findUnique({
                        where: { id: token.sub },
                        select: { role: true, subscriptionStatus: true, subscriptionExpiresAt: true, isEmailVerified: true }
                    })
                    if (dbUser) {
                        token.role = dbUser.role
                        token.subscriptionStatus = dbUser.subscriptionStatus
                        token.subscriptionExpiresAt = dbUser.subscriptionExpiresAt?.toISOString()
                        // @ts-ignore
                        token.isEmailVerified = dbUser.isEmailVerified
                    }
                } catch (e) {
                    // In Node.js runtime this is fine.
                    // On Edge, this would crash. But this full config is only used in Node.
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
                session.user.isEmailVerified = token.isEmailVerified as boolean
            }
            return session
        },
        async signIn({ user }) {
            // Retroactive fix for existing users
            if (user.email) {
                try {
                    // Check if trial is required
                    const existingUser = await db.user.findUnique({ where: { email: user.email } })
                    if (existingUser && !existingUser.trialEndsAt && existingUser.subscriptionStatus === 'trial') {
                        const trialEndsAt = new Date()
                        trialEndsAt.setDate(trialEndsAt.getDate() + 15)
                        await db.user.update({ where: { id: existingUser.id }, data: { trialEndsAt } })
                    }
                } catch (e) { console.error(e) }
            }
            return true
        }
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
