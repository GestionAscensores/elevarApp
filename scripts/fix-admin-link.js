const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const email = 'amilcarserra@gmail.com'

    const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true }
    })

    if (!user) {
        console.error('User not found')
        return
    }

    console.log(`Usuario encontrado: ${user.email}`)
    console.log(`Cuentas vinculadas actuales: ${user.accounts.length}`)

    if (user.accounts.length > 0) {
        console.log('Eliminando vinculaciones antiguas para permitir relink limpio...')
        const deleted = await prisma.account.deleteMany({
            where: { userId: user.id }
        })
        console.log(`✅ Se eliminaron ${deleted.count} vinculaciones.`)
        console.log('Ahora el próximo login (si allowDangerousEmailAccountLinking funciona) creará una nueva vinculación correcta.')
    } else {
        console.log('No había vinculaciones para eliminar.')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
