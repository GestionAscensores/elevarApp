const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        where: {
            email: {
                contains: 'niniamonarca'
            }
        },
        select: {
            email: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            role: true
        }
    })
    console.log(JSON.stringify(users, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
