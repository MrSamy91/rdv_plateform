// Seed pour le dev local — populate la BDD avec des donnees de test.
// Run : pnpm db:seed
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')
  // TODO: ajouter des donnees de test (users, organizations, services, etc.)
  // Pour l'instant, on cree un seed vide pour valider le pipeline.
  console.log('✅ Seed termine')
}

main()
  .catch((e) => {
    console.error('❌ Seed echec :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
