
import { db } from '@/lib/db'

async function simulateUpdate() {
    // 1. Create a dummy user and client if needed, or find existing
    // Let's assume we use the first user found or create one
    let user = await db.user.findFirst()
    if (!user) {
        console.log('No user found, creating one...')
        user = await db.user.create({
            data: {
                email: 'test@example.com',
                name: 'Test',
                password: 'password', // dummy
            }
        })
    }

    console.log('Using User:', user.id)

    // 2. Create a Client with Item
    const client = await db.client.create({
        data: {
            userId: user.id,
            name: 'Debug Client',
            cuit: '20123456789',
            ivaCondition: 'Consumidor Final',
            items: {
                create: {
                    type: 'Ascensor',
                    quantity: 1,
                    price: 1000
                }
            }
        },
        include: { items: true }
    })
    console.log('Created Client:', client.id)

    // 3. Perform manual transaction Update + History
    const item = client.items[0]
    const currentMonth = new Date().toISOString().slice(0, 7)

    try {
        await db.$transaction([
            db.clientEquipment.update({
                where: { id: item.id },
                data: { price: 1100 }
            }),
            db.priceHistory.create({
                data: {
                    clientId: client.id,
                    previousPrice: 1000,
                    newPrice: 1100,
                    percentageChange: 10,
                    month: currentMonth,
                    updatedBy: user.id,
                    isMassUpdate: true
                }
            })
        ])
        console.log('Transaction success.')
    } catch (e) {
        console.error('Transaction failed:', e)
    }

    // 4. Verify History
    const count = await db.priceHistory.count()
    console.log('PriceHistory count after test:', count)

    // Cleanup
    await db.client.delete({ where: { id: client.id } }) // Cascade should delete history
    console.log('Cleanup done.')
}

simulateUpdate()
    .catch(console.error)
    .finally(() => process.exit())
