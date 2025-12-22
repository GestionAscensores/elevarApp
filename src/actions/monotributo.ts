'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { MONOTRIBUTO_SCALES } from '@/lib/monotributo'

import { revalidateTag, unstable_cache } from 'next/cache'

async function calculateMonotributoStatus(userId: string) {
    // 1. Calculate TTM (Trailing 12 Months) Revenue using Accrual Basis (Devengado)
    const today = new Date()
    const lastYear = new Date(today)
    lastYear.setFullYear(today.getFullYear() - 1)

    // We need to fetch all potentially relevant invoices.
    // Since an invoice from 2 years ago could technically refer to a service today (unlikely but possible),
    // or an invoice today refers to a service 2 years ago (also unlikely).
    // To be safe and efficient, let's fetch invoices from the LAST 18 MONTHS based on emission date,
    // which should cover 99.9% of "delayed billing" cases for the TTM period.
    const searchStart = new Date(lastYear)
    searchStart.setMonth(searchStart.getMonth() - 6) // Buffer of 6 months

    const allInvoices = await db.invoice.findMany({
        where: {
            userId: userId,
            status: 'APPROVED',
            date: { gte: searchStart }
        },
        select: {
            totalAmount: true,
            type: true,
            date: true,
            serviceTo: true,
            serviceFrom: true
        }
    })

    let grossRevenue = 0

    for (const inv of allInvoices) {
        // Determine the "Effective Date" for Monotributo calculation
        // Priority: ServiceTo > ServiceFrom > InvoiceDate
        let effectiveDate = inv.date
        if (inv.serviceTo) effectiveDate = inv.serviceTo
        else if (inv.serviceFrom) effectiveDate = inv.serviceFrom

        // Check if this effective date falls within the TTM window [lastYear, today]
        if (effectiveDate >= lastYear && effectiveDate <= today) {
            const amount = Number(inv.totalAmount)

            // Add or Subtract based on type
            if (['NCA', 'NCB', 'NCC'].includes(inv.type)) {
                grossRevenue -= amount
            } else if (!['QUOTE', 'DRAFT'].includes(inv.type)) {
                grossRevenue += amount
            }
        }
    }

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
        isExcluded: currentCategory.code === 'EXCLUIDO' || (isService && grossRevenue > serviceLimit),
        hasInvoices: allInvoices.length > 0,
        periodStart: lastYear.toISOString(),
        periodEnd: today.toISOString()
    }
}

export async function getMonotributoStatus() {
    const session = await verifySession()
    if (!session) return null

    // Check configuration
    const config = await db.userConfig.findUnique({ where: { userId: session.userId } })
    if (!config || config.ivaCondition !== 'Monotributo') {
        return { shouldHide: true }
    }

    // Cache for 1 hour
    const getCached = unstable_cache(
        async () => calculateMonotributoStatus(session.userId),
        [`monotributo-status-${session.userId}`],
        {
            revalidate: 3600, // 1 hour
            tags: [`monotributo-${session.userId}`]
        }
    )

    return getCached()
}

export async function invalidateMonotributoCache() {
    const session = await verifySession()
    if (session) {
        revalidateTag(`monotributo-${session.userId}`)
    }
}
