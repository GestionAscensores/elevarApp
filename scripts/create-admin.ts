import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function createAdminUser() {
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const user = await db.user.create({
        data: {
            cuit: '20123456789',
            email: 'admin@elevar.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'ADMIN',
            subscriptionStatus: 'active',
            isEmailVerified: true,
            acceptedTerms: true,
            acceptedTermsAt: new Date(),
            config: {
                create: {}
            }
        }
    })

    console.log('✅ Usuario admin creado:')
    console.log('CUIT: 20123456789')
    console.log('Password: admin123')
    console.log('Role:', user.role)
}

createAdminUser()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
