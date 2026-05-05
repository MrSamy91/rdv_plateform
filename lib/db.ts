// Client Prisma singleton (Prisma 7 + driver adapter pg).
//
// Pourquoi singleton : eviter de creer plusieurs instances en dev (Next.js HMR
// recharge les modules a chaque modif → fuite de connexions Postgres).
//
// Pourquoi adapter pg : Prisma 7 exige un driver adapter pour le runtime.
// `@prisma/adapter-pg` fonctionne avec n'importe quel Postgres (Docker local,
// Neon, Supabase, etc.). En prod sur Neon, on pourra switcher vers
// `@prisma/adapter-neon` pour profiter du driver serverless.
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
