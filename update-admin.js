const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateAdminUser() {
    try {
        // Buscar usuario por email
        const email = 'amilcarserra@gmail.com' // Cambia esto a tu email

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            console.log('❌ Usuario no encontrado')
            return
        }

        console.log('📋 Usuario actual:')
        console.log({
            id: user.id,
            email: user.email,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            trialEndsAt: user.trialEndsAt
        })

        // Actualizar a ADMIN con suscripción activa
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1) // 1 año desde ahora

        const updated = await prisma.user.update({
            where: { email },
            data: {
                role: 'ADMIN',
                subscriptionStatus: 'active',
                subscriptionExpiresAt: futureDate,
                trialEndsAt: futureDate,
                isActive: true
            }
        })

        console.log('\n✅ Usuario actualizado exitosamente:')
        console.log({
            role: updated.role,
            subscriptionStatus: updated.subscriptionStatus,
            subscriptionExpiresAt: updated.subscriptionExpiresAt,
            trialEndsAt: updated.trialEndsAt
        })
        console.log('\n🔄 Ahora cierra sesión y vuelve a entrar con Google')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

updateAdminUser()
