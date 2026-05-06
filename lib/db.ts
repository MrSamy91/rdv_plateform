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

function getDatabaseUrl() {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL
  }

  if (process.env.SKIP_ENV_VALIDATION) {
    return ['postgresql://', 'localhost', ':5432/', 'cutbook'].join('')
  }

  throw new Error('DATABASE_URL is required to initialize Prisma')
}

function createPrismaClient() {
  const connectionString = getDatabaseUrl()

  const adapter =
    env.NODE_ENV === 'production'
      ? new PrismaNeon({ connectionString })
      : new PrismaPg({ connectionString })

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
