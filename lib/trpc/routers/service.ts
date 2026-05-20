// Router tRPC pour les prestations d'un salon.
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../init'

const serviceInputSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(2).max(80),
  description: z.string().max(500).nullable().optional(),
  duration: z.number().int().min(5).max(480),
  price: z.number().min(0).max(10_000),
})

const updateServiceSchema = serviceInputSchema
  .omit({ orgId: true })
  .partial()
  .extend({
    serviceId: z.string().min(1),
  })
  .refine(
    ({ name, description, duration, price }) =>
      name !== undefined ||
      description !== undefined ||
      duration !== undefined ||
      price !== undefined,
    'Au moins un champ doit etre renseigne.',
  )

async function ensureOrgAccess(
  ctx: { db: typeof import('@/lib/db').db; user: { id: string } },
  orgId: string,
) {
  const organization = await ctx.db.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      ownerId: true,
      members: {
        where: { userId: ctx.user.id },
        select: { id: true },
      },
    },
  })

  if (!organization) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon introuvable.' })
  }

  if (organization.ownerId !== ctx.user.id && organization.members.length === 0) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Vous ne pouvez pas acceder aux services de ce salon.',
    })
  }

  return organization
}

async function ensureOrgOwner(
  ctx: { db: typeof import('@/lib/db').db; user: { id: string } },
  orgId: string,
) {
  const organization = await ctx.db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, ownerId: true },
  })

  if (!organization) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon introuvable.' })
  }

  if (organization.ownerId !== ctx.user.id) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Seul le proprietaire du salon peut modifier les services.',
    })
  }

  return organization
}

async function getServiceForOwner(
  ctx: { db: typeof import('@/lib/db').db; user: { id: string } },
  serviceId: string,
) {
  const service = await ctx.db.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      orgId: true,
      organization: {
        select: {
          ownerId: true,
        },
      },
    },
  })

  if (!service) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Service introuvable.' })
  }

  if (service.organization.ownerId !== ctx.user.id) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Seul le proprietaire du salon peut modifier ce service.',
    })
  }

  return service
}

export const serviceRouter = router({
  listByOrganization: protectedProcedure
    .input(z.object({ orgId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await ensureOrgAccess(ctx, input.orgId)

      return await ctx.db.service.findMany({
        where: { orgId: input.orgId },
        orderBy: [{ name: 'asc' }],
      })
    }),

  create: protectedProcedure.input(serviceInputSchema).mutation(async ({ ctx, input }) => {
    await ensureOrgOwner(ctx, input.orgId)

    return await ctx.db.service.create({
      data: {
        orgId: input.orgId,
        name: input.name,
        description: input.description ?? null,
        duration: input.duration,
        price: input.price,
      },
    })
  }),

  update: protectedProcedure.input(updateServiceSchema).mutation(async ({ ctx, input }) => {
    const service = await getServiceForOwner(ctx, input.serviceId)

    return await ctx.db.service.update({
      where: { id: service.id },
      data: {
        name: input.name,
        description: input.description,
        duration: input.duration,
        price: input.price,
      },
    })
  }),

  delete: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const service = await getServiceForOwner(ctx, input.serviceId)

      const bookingsCount = await ctx.db.booking.count({
        where: { serviceId: service.id },
      })

      if (bookingsCount > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Impossible de supprimer un service lie a des reservations.',
        })
      }

      await ctx.db.service.delete({ where: { id: service.id } })

      return { serviceId: service.id }
    }),
})
