'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

interface AutoBillingNotifierProps {
    result?: {
        triggered: boolean
        message: string
        error?: boolean
    }
}

export function AutoBillingNotifier({ result }: AutoBillingNotifierProps) {
    useEffect(() => {
        if (result?.triggered) {
            if (result.error) {
                toast.error(result.message)
            } else {
                toast.success(result.message, { duration: 5000 })
            }
        }
    }, [result])

    return null
}
