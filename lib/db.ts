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
import { env } from '@/lib/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  })

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
