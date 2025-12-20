const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'niniamonarca@gmail.com'
    console.log(`Fixing user ${email}...`)

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 30)

    const user = await prisma.user.update({
        where: { email },
        data: {
            trialEndsAt: trialEndsAt,
            subscriptionStatus: 'trial'
        }
    })
    console.log('Fixed user:', user)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
