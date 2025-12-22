'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { checkAutoBillingAction } from '@/actions/scheduler'

export function AutoBillingNotifier() {
    useEffect(() => {
        const check = async () => {
            try {
                const result = await checkAutoBillingAction()
                if (result?.triggered) {
                    if (result.error) {
                        toast.error(result.message)
                    } else {
                        toast.success(result.message, { duration: 5000 })
                    }
                }
            } catch (error) {
                console.error("Auto billing check failed", error)
            }
        }

        check()
    }, [])

    return null
}
