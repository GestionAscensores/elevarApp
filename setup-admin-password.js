const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function setupAdminWithPassword() {
    try {
        const email = 'amilcarserra@gmail.com'
        const cuit = '20254459306' // Tu CUIT real
        const password = 'admin123' // Cambia esto si quieres otra contraseña

        console.log('🔐 Configurando usuario admin...')
        console.log('Email:', email)
        console.log('CUIT:', cuit)

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10)

        // Buscar usuario existente
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (user) {
            // Actualizar usuario existente
            const updated = await prisma.user.update({
                where: { email },
                data: {
                    cuit: cuit,
                    password: hashedPassword,
                    role: 'ADMIN',
                    subscriptionStatus: 'active',
                    subscriptionExpiresAt: new Date('2026-12-31'),
                    isActive: true
                }
            })

            console.log('\n✅ Usuario actualizado exitosamente!')
            console.log('📋 Datos:')
            console.log('  Email:', updated.email)
            console.log('  CUIT:', updated.cuit)
            console.log('  Role:', updated.role)
            console.log('  Subscription:', updated.subscriptionStatus)
            console.log('\n🔑 Credenciales de login:')
            console.log('  CUIT:', cuit)
            console.log('  Contraseña:', password)
            console.log('\n📍 Ve a http://localhost:3000/login')
            console.log('   Usa CUIT y contraseña para ingresar')
        } else {
            console.log('❌ Usuario no encontrado')
            console.log('Asegúrate de haber creado el usuario con Google OAuth primero')
        }

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

setupAdminWithPassword()
