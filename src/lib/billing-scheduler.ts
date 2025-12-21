import { db } from '@/lib/db'
import { generateAutoBillingInternal } from '@/actions/billing-mass'

export async function checkAndTriggerAutoBilling(userId: string) {
    try {
        const rawConfig = await db.userConfig.findUnique({ where: { userId } })
        if (!rawConfig) return

        const config = rawConfig as any

        if (!config.autoBillingEnabled) return

        const now = new Date()
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // YYYY-MM

        // 1. Check if we already ran for this month
        if (config.lastAutoBillingMonth === currentMonthKey) {
            return // Already run
        }

        // 2. Check if today is >= scheduled day
        const today = now.getDate()
        if (today < config.autoBillingDay) {
            return // Not yet
        }

        // 3. TRIGGER
        console.log(`[AutoBilling] Triggering for user ${userId} for month ${currentMonthKey}`)
        const res: any = await generateAutoBillingInternal(userId)

        if (res.success || (res.count === 0)) { // count 0 is also success technically
            // 4. Update Config
            await db.userConfig.update({
                where: { userId },
                // @ts-ignore
                data: { lastAutoBillingMonth: currentMonthKey }
            })
            console.log(`[AutoBilling] Success. Updated lastAutoBillingMonth.`)
            return { triggered: true, message: 'Facturación automática generada.' }
        } else {
            console.error(`[AutoBilling] Failed:`, res)
            return { triggered: true, error: true, message: 'Error en facturación automática' }
        }

    } catch (error) {
        console.error('[AutoBilling] Error:', error)
    }
}
