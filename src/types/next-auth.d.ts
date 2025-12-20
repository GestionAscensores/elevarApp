import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string
            subscriptionStatus: string
            subscriptionExpiresAt?: string | null
            isEmailVerified: boolean
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        role: string
        subscriptionStatus: string
        subscriptionExpiresAt?: Date | null
        isEmailVerified: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        role?: string
        subscriptionStatus?: string
        subscriptionExpiresAt?: string | null
        isEmailVerified?: boolean
    }
}
