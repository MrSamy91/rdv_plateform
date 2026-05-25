// Init tRPC — INTERNE au module lib/trpc/.
// Definit le contexte (session, db) et les procedures de base (public, protected).
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { Role } from '@/generated/prisma/enums'
import { getSession, isAdminEmail } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Cree le contexte tRPC partage entre toutes les procedures.
 * Disponible dans chaque resolver via `ctx`.
 */
export async function createContext() {
  const session = await getSession()
  return {
    db,
    session,
    user: session?.user ?? null,
  }
}

type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson, // serialise Date, BigInt, Map, Set, etc.
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Si l'erreur vient de Zod, on expose les details
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// Helper pour creer un router
export const router = t.router

// Helper pour merger des routers
export const mergeRouters = t.mergeRouters

/**
 * Procedure publique : accessible a tous (connecte ou pas).
 */
export const publicProcedure = t.procedure

/**
 * Procedure protegee : requiert un user connecte.
 * Throws UNAUTHORIZED sinon.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      // narrowing : ctx.user est garanti non-null
      user: ctx.user,
    },
  })
})

/**
 * Procedure admin : requiert un user connecte ET admin.
 * On relit le role FRAIS en BDD (pas le role du cookie de session, qui peut
 * etre cache jusqu'a 5 min) pour ne pas laisser passer un admin retrograde.
 * Bootstrap ADMIN_EMAILS supporte, comme requireAdmin().
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const dbUser = await ctx.db.user.findUnique({
    where: { id: ctx.user.id },
    select: { role: true, email: true },
  })

  if (!dbUser || (dbUser.role !== Role.ADMIN && !isAdminEmail(dbUser.email))) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  return next({ ctx })
})
