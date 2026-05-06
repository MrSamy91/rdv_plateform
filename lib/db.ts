// Client Prisma singleton (Prisma 7 + driver adapters).
//
// Pourquoi singleton : eviter de creer plusieurs instances en dev (Next.js HMR
// recharge les modules a chaque modif → fuite de connexions Postgres).
//
// Pourquoi deux adapters : on garde `pg` en local pour Docker/Postgres classique,
// et on utilise le driver serverless Neon en production sur Vercel.
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from '@/lib/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to initialize Prisma')
  }

  const adapter =
    env.NODE_ENV === 'production'
      ? new PrismaNeon({ connectionString: env.DATABASE_URL })
      : new PrismaPg({ connectionString: env.DATABASE_URL })

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
