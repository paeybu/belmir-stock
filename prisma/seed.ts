import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashed = await bcrypt.hash('password123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: hashed, name: 'Admin' },
  })

  const locations = ['Warehouse A', 'Warehouse B', 'Shop Floor']
  for (const name of locations) {
    await prisma.location.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log('Seed complete. Login: admin@example.com / password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
