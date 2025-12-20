import { handlers } from "@/lib/auth"

// Force Node.js runtime for NextAuth to work properly with Google OAuth
export const runtime = 'nodejs'

export const { GET, POST } = handlers
