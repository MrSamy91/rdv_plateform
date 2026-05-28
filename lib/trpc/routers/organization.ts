// Router tRPC pour les organisations.
// Endpoints : list, getBySlug, create, update.
// Convention : 1 fichier = 1 domaine metier.
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createOrganizationSchema, organizationSlugSchema } from '@/lib/organizations/schema'
import { protectedProcedure, publicProcedure, router } from '../init'
import { getOwnedOrg } from '../owner'

export const organizationRouter = router({
  /**
   * Recupere une orga par son slug (URL `/@slug`).
   * Public : pas besoin d'etre connecte.
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: organizationSlugSchema }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { slug: input.slug },
        include: {
          services: true,
          members: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      })

      if (!org) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organisation introuvable' })
      }

      return org
    }),

  /**
   * Cree une nouvelle orga (l'utilisateur connecte devient Owner).
   */
  create: protectedProcedure.input(createOrganizationSchema).mutation(async ({ ctx, input }) => {
    // L'utilisateur est-il déjà membre d'une organisation ?
    const existingMember = await ctx.db.member.findUnique({
      where: { userId: ctx.user.id },
    })
    if (existingMember) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Vous avez déjà un profil professionnel.',
      })
    }

    // Vérifier que le slug n'est pas déjà pris
    const existingSlug = await ctx.db.organization.findUnique({ where: { slug: input.slug } })
    if (existingSlug) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Ce slug est déjà utilisé.' })
    }

    // Transaction atomique : crée l'organisation + le record Member
    return await ctx.db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { ...input, ownerId: ctx.user.id },
      })

      await tx.member.create({
        data: { userId: ctx.user.id, orgId: org.id },
      })

      return org
    })
  }),

  /**
   * Equipe de l'orga gérée par le owner : liste des membres avec leurs infos user.
   */
  teamMembers: protectedProcedure.query(async ({ ctx }) => {
    const org = await getOwnedOrg(ctx)

    const members = await ctx.db.member.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    return members.map((member) => ({
      id: member.id,
      joinedAt: member.createdAt,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      isOwner: member.user.id === org.ownerId,
    }))
  }),

  /**
   * Retrait d'un membre (owner). Le owner ne peut pas se retirer lui-même ;
   * refus si le membre a des réservations (intégrité de l'historique).
   */
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOwnedOrg(ctx)

      const member = await ctx.db.member.findUnique({
        where: { id: input.memberId },
        select: { id: true, orgId: true, userId: true },
      })

      if (!member || member.orgId !== org.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Professionnel introuvable.' })
      }

      if (member.userId === org.ownerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Le proprietaire ne peut pas etre retire de son organisation.',
        })
      }

      const bookingsCount = await ctx.db.booking.count({ where: { memberId: member.id } })

      if (bookingsCount > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ce professionnel a des reservations, impossible de le retirer.',
        })
      }

      // Pas de réservations -> on nettoie ses dépendances puis on le retire.
      // (MemberService part en cascade via la relation onDelete.)
      await ctx.db.$transaction(async (tx) => {
        await tx.review.deleteMany({ where: { memberId: member.id } })
        await tx.timeSlot.deleteMany({ where: { memberId: member.id } })
        await tx.member.delete({ where: { id: member.id } })
      })

      return { memberId: member.id }
    }),
})
