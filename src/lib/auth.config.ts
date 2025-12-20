import { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const authConfig: NextAuthConfig = {
    // @ts-ignore - Conflicto de tipos entre @auth/core y prisma adapter
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
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

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

                if (!user || !user.password) {
                    return null
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!passwordMatch) {
                    return null
                }

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
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub!
                // @ts-ignore - Agregar campos personalizados a la sesión
                session.user.role = token.role as string
                session.user.subscriptionStatus = token.subscriptionStatus as string
                // @ts-ignore - Conflicto de tipos Date vs string
                session.user.subscriptionExpiresAt = token.subscriptionExpiresAt as string | null
                session.user.isEmailVerified = token.isEmailVerified as boolean
            }
            return session
        },
        async jwt({ token, user, account, profile, trigger }) {
            console.log("🔧 JWT CALLBACK:", {
                hasUser: !!user,
                hasAccount: !!account,
                hasProfile: !!profile,
                trigger,
                tokenSub: token.sub
            })

            // En el primer sign-in con credentials, user está disponible
            if (user) {
                console.log("✅ Usuario disponible en JWT callback. USER COMPLETO:", JSON.stringify(user, null, 2))
                token.sub = user.id
                token.role = user.role
                token.subscriptionStatus = user.subscriptionStatus
                token.subscriptionExpiresAt = user.subscriptionExpiresAt?.toISOString()
                token.subscriptionExpiresAt = user.subscriptionExpiresAt?.toISOString()
                // @ts-ignore - Check both custom boolean and standard NextAuth Date field
                token.isEmailVerified = user.isEmailVerified || !!user.emailVerified

                console.log("📤 Retornando token:", {
                    sub: token.sub,
                    role: token.role,
                    subscriptionStatus: token.subscriptionStatus
                })

                return token
            }

            // Para OAuth, a veces user no está disponible pero tenemos profile
            // Necesitamos buscar el usuario en la BD usando el email del profile
            if (profile?.email && !token.role) {
                console.log("🔍 Buscando usuario en BD por email:", profile.email)
                try {
                    const dbUser = await db.user.findUnique({
                        where: { email: profile.email as string },
                        select: {
                            id: true,
                            role: true,
                            subscriptionStatus: true,
                            subscriptionExpiresAt: true
                        }
                    })

                    if (dbUser) {
                        console.log("✅ Usuario encontrado en BD:", dbUser)
                        token.sub = dbUser.id
                        token.role = dbUser.role
                        token.subscriptionStatus = dbUser.subscriptionStatus
                        token.subscriptionExpiresAt = dbUser.subscriptionExpiresAt?.toISOString()
                    } else {
                        console.log("❌ Usuario NO encontrado en BD")
                    }
                } catch (error) {
                    console.error("❌ Error buscando usuario:", error)
                }
            }

            // ------------------------------------------------------------------
            // ALWAYS refresh critical data from DB to ensure Subscription/Role is up to date
            // This fixes the issue where a user pays but the session remains "trial/expired"
            // ------------------------------------------------------------------
            if (token.sub) {
                // Only if we haven't just fetched it above (user is undefined)
                if (!user) {
                    try {
                        const dbUser = await db.user.findUnique({
                            where: { id: token.sub },
                            select: {
                                role: true,
                                subscriptionStatus: true,
                                subscriptionExpiresAt: true,
                                isEmailVerified: true
                            }
                        })

                        if (dbUser) {
                            // console.log("🔄 Refreshing Session Data from DB:", dbUser.subscriptionStatus)
                            token.role = dbUser.role
                            token.subscriptionStatus = dbUser.subscriptionStatus
                            token.subscriptionExpiresAt = dbUser.subscriptionExpiresAt?.toISOString()
                            // @ts-ignore
                            token.isEmailVerified = dbUser.isEmailVerified
                        }
                    } catch (e) {
                        console.error("Error refreshing token data", e)
                    }
                }
            }

            console.log("📤 Retornando token final:", {
                sub: token.sub,
                role: token.role,
                subscriptionStatus: token.subscriptionStatus
            })

            return token
        },
        async signIn({ user, account, profile }) {
            // Retroactive fix for existing users with missing trial
            if (user.email) {
                try {
                    const existingUser = await db.user.findUnique({
                        where: { email: user.email }
                    })

                    if (existingUser && !existingUser.trialEndsAt && existingUser.subscriptionStatus === 'trial') {
                        console.log("🛠️ Fixing missing trial date for user:", user.email)
                        const trialEndsAt = new Date()
                        trialEndsAt.setDate(trialEndsAt.getDate() + 30) // 30 days trial

                        await db.user.update({
                            where: { id: existingUser.id },
                            data: { trialEndsAt }
                        })
                    }
                } catch (error) {
                    console.error("Error updating user trial in signIn:", error)
                }
            }
            return true
        }
    },
    events: {
        async createUser({ user }) {
            console.log("🆕 User created, setting trial period for:", user.email)
            if (user.id) {
                const trialEndsAt = new Date()
                trialEndsAt.setDate(trialEndsAt.getDate() + 30) // 30 days trial

                try {
                    await db.user.update({
                        where: { id: user.id },
                        data: {
                            trialEndsAt,
                            subscriptionStatus: 'trial' // Ensure status is trial
                        }
                    })
                } catch (error) {
                    console.error("Error setting trial for new user:", error)
                }
            }
        }
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
}
