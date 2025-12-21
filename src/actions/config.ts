'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { encryptData } from '@/lib/encryption'
import { revalidatePath } from 'next/cache'

const ConfigSchema = z.object({
    cert: z.string().optional(),
    key: z.string().optional(),
    salePoint: z.coerce.number().min(1).optional(),
    ivaCondition: z.string().optional(),
    fantasyName: z.string().optional(),
    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
    businessPhone: z.string().optional(),
    logoUrl: z.string().optional(),
    emailSubject: z.string().optional(),
    emailBody: z.string().optional(),
})

export async function updateConfig(prevState: any, formData: FormData) {
    const session = await verifySession()
    if (!session) return { message: 'No autorizado' }

    // Manual handling for file uploads or text input
    // Assuming user pastes content for now or simple file read on client
    // For this implementation, we expect text content in the form

    const cert = formData.get('cert') as string
    const key = formData.get('key') as string
    const salePoint = formData.get('salePoint')
    const afipEnvironment = formData.get('afipEnvironment') as string
    const ivaCondition = formData.get('ivaCondition') as string
    const emailSubject = formData.get('emailSubject') as string
    const emailBody = formData.get('emailBody') as string
    const fantasyName = formData.get('fantasyName') as string
    const businessName = formData.get('businessName') as string
    const businessAddress = formData.get('businessAddress') as string
    const businessPhone = formData.get('businessPhone') as string
    const logoUrl = formData.get('logoUrl') as string
    const email = formData.get('email') as string

    // We only update provided fields
    const updateData: any = {}

    // Always update these
    if (afipEnvironment === 'PRODUCTION' || afipEnvironment === 'TEST') {
        updateData.afipEnvironment = afipEnvironment
    }

    // Only update if not null/undefined to avoid overwriting with empty
    // But empty strings might be intentional clearing? Let's allow strings.
    updateData.businessName = businessName
    updateData.businessAddress = businessAddress
    updateData.businessPhone = businessPhone
    updateData.businessEmail = email // Map the form 'email' field to businessEmail in config
    updateData.logoUrl = logoUrl

    if (cert && cert.trim().length > 0) {
        updateData.certEncrypted = encryptData(cert)
    }

    if (key && key.trim().length > 0) {
        updateData.keyEncrypted = encryptData(key)
    }

    if (salePoint) {
        updateData.salePoint = Number(salePoint)
    }

    if (ivaCondition) {
        updateData.ivaCondition = ivaCondition
    }

    try {
        await db.$transaction(async (tx) => {
            // Update User Config
            await tx.userConfig.upsert({
                where: { userId: session.userId },
                create: {
                    userId: session.userId,
                    ...updateData
                },
                update: updateData
            })

            // Update User CUIT if provided (but NOT email)
            const userUpdateData: any = {}
            if (formData.get('cuit')) {
                userUpdateData.cuit = formData.get('cuit') as string
            }

            if (Object.keys(userUpdateData).length > 0) {
                await tx.user.update({
                    where: { id: session.userId },
                    data: userUpdateData
                })
            }
        })

        revalidatePath('/dashboard/config')
        return { success: true, message: 'Configuración actualizada.' }
    } catch (error) {
        console.error(error)
        return { message: 'Error: ' + (error instanceof Error ? error.message : String(error)) }
    }
}

export async function getConfig() {
    const session = await verifySession()
    if (!session) return null

    const config = await db.userConfig.findUnique({
        where: { userId: session.userId },
        include: {
            user: {
                select: {
                    email: true,
                    cuit: true
                }
            }
        }
    })

    if (!config) return null

    return {
        ...config,
        afipExpiration: config.afipExpiration?.toISOString() || null
    }
}
