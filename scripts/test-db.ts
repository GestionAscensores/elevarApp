import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: ['query', 'info', 'warn', 'error']
})

async function main() {
    console.log('--- DB Connectivity Test ---')
    const url = process.env.DATABASE_URL
    if (!url) {
        console.error('❌ DATABASE_URL is missing')
        return
    }

    // Mask password
    const maskedUrl = url.replace(/:([^:@]+)@/, ':****@')
    console.log(`Target: ${maskedUrl}`)

    if (!url.includes('pooler.supabase.com')) {
        console.warn('⚠️  WARNING: URL does not look like a connection pooler URL!')
    }

    try {
        console.log('Attempting to connect...')
        await prisma.$connect()
        console.log('✅ Connection successful!')

        const count = await prisma.user.count()
        console.log(`✅ Can query! User count: ${count}`)
    } catch (error) {
        console.error('❌ Connection failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
