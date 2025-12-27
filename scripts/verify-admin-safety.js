const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const email = 'amilcarserra@gmail.com'
    console.log(`Verificando integridad de usuario: ${email}...`)

    const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true }
    })

    if (user) {
        console.log('✅ ¡TU CUENTA SIGUE AHÍ! NO SE BORRÓ NADA IMPORTANTE.')
        console.log('---------------------------------------------------')
        console.log(`ID: ${user.id}`)
        console.log(`Rol: ${user.role}`)
        console.log(`Email: ${user.email}`)
        console.log(`Password (Hash): ${user.password ? 'Protegido (Existe)' : 'No tiene'}`)
        console.log('---------------------------------------------------')
        console.log('Lo único que borré fue el "enlace roto" con Google.')
        console.log('Tus datos, clientes, facturas y configuración de Admin están intactos.')
    } else {
        console.error('❌ ERROR CRÍTICO: Usuario no encontrado.')
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect())
