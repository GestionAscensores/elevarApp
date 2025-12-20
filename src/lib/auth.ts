import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { cookies } from "next/headers"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

/**
 * Alternative getSession for Server Components that works with Google OAuth
 * This bypasses the issue with auth() returning null for OAuth users
 */
export async function getSession() {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('authjs.session-token')?.value ||
            cookieStore.get('__Secure-authjs.session-token')?.value

        if (!sessionToken) {
            return null
        }

        // Use the middleware auth which works better with cookies
        const session = await auth()
        return session
    } catch (error) {
        console.error("Error getting session:", error)
        return null
    }
}
