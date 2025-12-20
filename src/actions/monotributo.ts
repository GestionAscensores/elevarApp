'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { MONOTRIBUTO_SCALES } from '@/lib/monotributo'

export async function getMonotributoStatus() {
    const session = await verifySession()
    if (!session) return null

    // 1. Calculate TTM (Trailing 12 Months) Revenue
    const today = new Date()
    const lastYear = new Date(today)
    lastYear.setFullYear(today.getFullYear() - 1)

    // Sum Approved Invoices (A, B, C...)
    const invoices = await db.invoice.aggregate({
        _sum: { totalAmount: true },
        where: {
            userId: session.userId,
            status: 'APPROVED',
            date: {
                gte: lastYear,
                lte: today
            },
            type: { notIn: ['NCA', 'NCB', 'NCC', 'QUOTE', 'DRAFT'] } // Exclude NCs and drafts
        }
    })

    // Sum Credit Notes (to subtract)
    const creditNotes = await db.invoice.aggregate({
        _sum: { totalAmount: true },
        where: {
            userId: session.userId,
            status: 'APPROVED',
            date: {
                gte: lastYear,
                lte: today
            },
            type: { in: ['NCA', 'NCB', 'NCC'] }
        }
    })

    const grossRevenue = (Number(invoices._sum.totalAmount) || 0) - (Number(creditNotes._sum.totalAmount) || 0)

    // 2. Determine Category
    // Assume Service Provider (Limit H) unless specified otherwise? 
    // Most users of this app are Elevator Services.
    const isService = true // Could be configurable later

    // Find matching category
    // Logic: You belong to the category whose limit is >= your revenue.
    // E.g. Revenue 5M -> Cat A (Limit 8.9M).
    // Revenue 10M -> Cat B (Limit 13M).
    let currentCategory = MONOTRIBUTO_SCALES.find(s => s.limit >= grossRevenue)

    // If revenue exceeds largest limit, you are "Excluded"
    if (!currentCategory) {
        // Exceeded K (or K limit)
        currentCategory = { code: 'EXCLUIDO', limit: 0, servicesAllowed: false, goodsAllowed: false }
    } else {
        // If Services, check if exceeded H
        if (isService && !currentCategory.servicesAllowed) {
            // If I am in I, J, K but I provide services -> Excluded from Monotributo (Must be RI)
            // But technically you "stay" in H until recategorization excludes you? 
            // Warnings should appear.
        }
    }

    // Next Category
    const currentIndex = MONOTRIBUTO_SCALES.findIndex(c => c.code === currentCategory?.code)
    const nextCategory = MONOTRIBUTO_SCALES[currentIndex + 1]

    // Service Limit Reference (Cat H)
    const serviceLimit = MONOTRIBUTO_SCALES.find(s => s.code === 'H')!.limit

    return {
        grossRevenue,
        currentCategoryCode: currentCategory.code,
        currentCategoryLimit: currentCategory.limit,
        nextCategoryCode: nextCategory ? nextCategory.code : null,
        nextCategoryLimit: nextCategory ? nextCategory.limit : null,
        serviceLimit: serviceLimit,
        isExcluded: currentCategory.code === 'EXCLUIDO' || (isService && grossRevenue > serviceLimit)
    }
}
