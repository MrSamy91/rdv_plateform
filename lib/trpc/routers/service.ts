// Router tRPC pour les prestations d'un salon.
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../init'
import {
  serviceInputSchema,
  updateServiceSchema,
  setServiceMembersSchema,
} from '@/lib/services/schema'

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

async function ensureMembersBelongToOrg(
  ctx: { db: typeof import('@/lib/db').db },
  input: { orgId: string; memberIds: string[] },
) {
  if (input.memberIds.length === 0) {
    return
  }

  const uniqueMemberIds = [...new Set(input.memberIds)]
  const membersCount = await ctx.db.member.count({
    where: {
      id: { in: uniqueMemberIds },
      orgId: input.orgId,
    },
  })

  if (membersCount !== uniqueMemberIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tous les professionnels doivent appartenir au salon.',
    })
  }
}

async function getMemberForServiceUpdate(
  ctx: { db: typeof import('@/lib/db').db; user: { id: string } },
  memberId: string,
) {
  const member = await ctx.db.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      orgId: true,
      userId: true,
      organization: {
        select: {
          ownerId: true,
        },
      },
    },
  })

  if (!member) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Professionnel introuvable.' })
  }

  if (member.userId !== ctx.user.id && member.organization.ownerId !== ctx.user.id) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Vous ne pouvez pas modifier les services de ce professionnel.',
    })
  }

  return member
}

async function ensureServicesBelongToOrg(
  ctx: { db: typeof import('@/lib/db').db },
  input: { orgId: string; serviceIds: string[] },
) {
  if (input.serviceIds.length === 0) {
    return
  }

  const uniqueServiceIds = [...new Set(input.serviceIds)]
  const servicesCount = await ctx.db.service.count({
    where: {
      id: { in: uniqueServiceIds },
      orgId: input.orgId,
    },
  })

  if (servicesCount !== uniqueServiceIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tous les services doivent appartenir au salon.',
    })
  }
}

export const serviceRouter = router({
  listByOrganization: protectedProcedure
    .input(z.object({ orgId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await ensureOrgAccess(ctx, input.orgId)

      return await ctx.db.service.findMany({
        where: { orgId: input.orgId },
        include: {
          members: {
            select: {
              memberId: true,
              member: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ name: 'asc' }],
      })
    }),

  // Liste tous les professionnels du salon (pour l'UI d'assignation owner).
  // Accessible aux membres du salon + owner (meme garde que listByOrganization).
  listOrgMembers: protectedProcedure
    .input(z.object({ orgId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await ensureOrgAccess(ctx, input.orgId)

      return await ctx.db.member.findMany({
        where: { orgId: input.orgId },
        select: {
          id: true,
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    }),

  create: protectedProcedure.input(serviceInputSchema).mutation(async ({ ctx, input }) => {
    await ensureOrgOwner(ctx, input.orgId)
    await ensureMembersBelongToOrg(ctx, {
      orgId: input.orgId,
      memberIds: input.memberIds ?? [],
    })

    return await ctx.db.service.create({
      data: {
        orgId: input.orgId,
        name: input.name,
        description: input.description ?? null,
        duration: input.duration,
        price: input.price,
        members: input.memberIds?.length
          ? {
              createMany: {
                data: [...new Set(input.memberIds)].map((memberId) => ({ memberId })),
              },
            }
          : undefined,
      },
      include: {
        members: true,
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

  setMemberServices: protectedProcedure
    .input(
      z.object({
        memberId: z.string().min(1),
        serviceIds: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberForServiceUpdate(ctx, input.memberId)
      const serviceIds = [...new Set(input.serviceIds)]

      await ensureServicesBelongToOrg(ctx, {
        orgId: member.orgId,
        serviceIds,
      })

      await ctx.db.$transaction(async (tx) => {
        await tx.memberService.deleteMany({
          where: { memberId: member.id },
        })

        if (serviceIds.length > 0) {
          await tx.memberService.createMany({
            data: serviceIds.map((serviceId) => ({
              memberId: member.id,
              serviceId,
            })),
          })
        }
      })

      return {
        memberId: member.id,
        serviceIds,
      }
    }),

  // Assignation PAR SERVICE : fixe la liste des pros qui proposent un service.
  // Miroir de setMemberServices, cote owner uniquement (getServiceForOwner garde).
  setServiceMembers: protectedProcedure
    .input(setServiceMembersSchema)
    .mutation(async ({ ctx, input }) => {
      const service = await getServiceForOwner(ctx, input.serviceId)
      const memberIds = [...new Set(input.memberIds)]

      await ensureMembersBelongToOrg(ctx, {
        orgId: service.orgId,
        memberIds,
      })

      await ctx.db.$transaction(async (tx) => {
        await tx.memberService.deleteMany({
          where: { serviceId: service.id },
        })

        if (memberIds.length > 0) {
          await tx.memberService.createMany({
            data: memberIds.map((memberId) => ({
              memberId,
              serviceId: service.id,
            })),
          })
        }
      })

      return {
        serviceId: service.id,
        memberIds,
      }
    }),
})
