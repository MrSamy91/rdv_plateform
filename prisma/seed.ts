// Seed pour le dev local - populate la BDD avec des donnees de test.
// Run : pnpm db:seed
import 'dotenv/config'

import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  console.log('Seeding...')
  // TODO: ajouter des donnees de test (users, organizations, services, etc.)
  // Pour l'instant, on cree un seed vide pour valider le pipeline.
  console.log('Seed termine')
}

main()
  .catch((e: unknown) => {
    console.error('Seed echec :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
