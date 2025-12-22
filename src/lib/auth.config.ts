import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [], // Providers are configured in auth.ts for Node runtime
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt"
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        },
        async jwt({ token, user, trigger, session }) {
            // Edge-safe JWT callback (no DB calls here)
            if (user) {
                token.sub = user.id
                token.role = user.role
                token.subscriptionStatus = user.subscriptionStatus
                // @ts-ignore
                token.isEmailVerified = user.isEmailVerified
            }

            // If update trigger is called (client side update)
            if (trigger === "update" && session) {
                token = { ...token, ...session }
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
                session.user.isEmailVerified = token.isEmailVerified as boolean
            }
            return session
        }
    }
}
