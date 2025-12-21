import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <Suspense fallback={<LoadingSpinner className="h-8 w-8 text-primary" />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}
