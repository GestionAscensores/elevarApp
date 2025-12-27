const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const email = 'niniamonarca@gmail.com' // Tu email
    console.log(`Buscando usuario ${email}...`)

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        console.error('Usuario no encontrado')
        return
    }

    console.log('Usuario encontrado:', user.id)
    console.log('Estado actual:', user.subscriptionStatus)

    const newExpiry = new Date()
    newExpiry.setMonth(newExpiry.getMonth() + 1)

    await prisma.user.update({
        where: { id: user.id },
        data: {
            subscriptionStatus: 'active',
            subscriptionExpiresAt: newExpiry,
            isActive: true
        }
    })

    console.log('✅ Suscripción activada manualmente con éxito.')
    console.log('Vence:', newExpiry)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
