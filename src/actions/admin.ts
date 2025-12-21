'use server'

import { verifySession } from "@/lib/session"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export async function getAdminMetrics() {
    const session = await verifySession()
    if (!session || session.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    try {
        // Parallelize queries for performance
        const [
            totalUsers,
            trialUsers,
            activeSubs,
            verifiedUsers,
            totalInvoices,
            totalRevenue
        ] = await Promise.all([
            // 1. Total Users
            db.user.count(),

            // 2. Users in Trial
            db.user.count({ where: { subscriptionStatus: 'trial' } }),

            // 3. Active Subscriptions (paying)
            db.user.count({ where: { subscriptionStatus: 'active' } }),

            // 4. Verified Emails
            db.user.count({ where: { isEmailVerified: true } }),

            // 5. Total Invoices (All users)
            db.invoice.count(),

            // 6. Total Revenue (Approximate sum of all invoices)
            // Note: This matches all invoices regardless of status for now, ideally filter by 'CAE'
            db.invoice.aggregate({
                _sum: {
                    totalAmount: true
                },
                where: {
                    cae: { not: null } // Only valid invoices
                }
            })
        ])

        return {
            totalUsers,
            trialUsers,
            activeSubs,
            verifiedUsers,
            totalInvoices,
            totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        }

    } catch (error) {
        console.error("Error fetching admin metrics:", error)
        return null
    }
}
