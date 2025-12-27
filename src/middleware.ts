import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
    const token = req.auth
    const path = req.nextUrl.pathname

    // Si no está autenticado y está intentando acceder a rutas protegidas
    // Check both NextAuth token AND custom session cookie
    const hasCustomSession = !!req.cookies.get('session')

    if (!token && !hasCustomSession && (path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/verify-email"))) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    // Permitir acceso a verify-email para usuarios autenticados
    if (path === "/verify-email") {
        return NextResponse.next()
    }

    // Decrypt custom session if present
    let customSession = null
    if (!token && hasCustomSession) {
        try {
            // NOTE: We cannot use verifySession() here because it uses 'next/headers'
            const { decrypt } = await import('@/lib/session')
            customSession = await decrypt(req.cookies.get('session')?.value)
        } catch (e) {
            console.error("Middleware decrypt error", e)
        }
    }

    // Combined user object (either token or customSession)
    // token is NextAuth Session { user: { ... } }
    // customSession is Flat JWT Payload { role: ... }

    // @ts-ignore
    const userRole = token?.user?.role || customSession?.role
    // @ts-ignore
    const userSubStatus = token?.user?.subscriptionStatus || customSession?.subscriptionStatus
    // @ts-ignore
    const userSubExpires = token?.user?.subscriptionExpiresAt || customSession?.expiresAt

    // Log omitted for cleaner production logs, or kept for debugging
    // console.log("🔒 MIDDLEWARE CHECK:", { path, role: userRole })

    // Admin routes - only for ADMIN role
    if (path.startsWith("/admin")) {
        if (userRole !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url))
        }
    }

    // Dashboard routes - Strict Subscription Enforcement
    if (path.startsWith("/dashboard") && (token || customSession)) {

        // Exception: Allow access to the subscription page itself to avoid infinite loops
        if (path === "/dashboard/subscription" || path.startsWith("/dashboard/subscription/")) {
            return NextResponse.next()
        }

        // Exception: Admins bypass everything
        if (userRole === "ADMIN") {
            return NextResponse.next()
        }

        const subscriptionStatus = userSubStatus as string || 'trial'
        // @ts-ignore
        const trialEndsAt = (token?.user?.trialEndsAt || customSession?.trialEndsAt) as string

        // 1. Check Suspended/Cancelled
        if (subscriptionStatus === "suspended" || subscriptionStatus === "cancelled") {
            return NextResponse.redirect(new URL("/dashboard/subscription", req.url))
        }

        // 2. Check Expired Trial
        if (subscriptionStatus === "trial") {
            // If no trial date, we assume it's valid (or self-healing didn't run yet)
            // But if exists and is past, BLOCK.
            if (trialEndsAt) {
                const expiryDate = new Date(trialEndsAt)
                const now = new Date()

                console.log("Middleware Check:", {
                    status: subscriptionStatus,
                    trialEndsAt,
                    expiryDate: expiryDate.toISOString(),
                    now: now.toISOString(),
                    isExpired: expiryDate < now
                })

                if (expiryDate < now) {
                    // console.log("Blocking expired trial user", { expiryDate })
                    return NextResponse.redirect(new URL("/dashboard/subscription", req.url))
                }
            }
        }

        // 3. Check Active Subscription Expiry (optional validation)
        if (subscriptionStatus === "active" && userSubExpires) {
            const expiryDate = new Date(userSubExpires as string)
            if (expiryDate < new Date()) {
                // Fallback to trial or suspended? For now, redirect to pay.
                return NextResponse.redirect(new URL("/dashboard/subscription", req.url))
            }
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/verify-email"]
}
