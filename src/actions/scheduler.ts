'use server'

import { checkAndTriggerAutoBilling } from '@/lib/billing-scheduler'
import { verifySession } from '@/lib/session'

export async function checkAutoBillingAction() {
    const session = await verifySession()
    if (!session?.userId) return { triggered: false }

    // We can call the lib function from here
    return await checkAndTriggerAutoBilling(session.userId)
}
