// Router tRPC pour les organisations.
// Endpoints : list, getBySlug, create, update.
// Convention : 1 fichier = 1 domaine metier.
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { protectedProcedure, publicProcedure, router } from '../init'

export const organizationRouter = router({
  /**
   * Recupere une orga par son slug (URL `/@slug`).
   * Public : pas besoin d'etre connecte.
   */
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
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
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50),
        slug: z
          .string()
          .min(2)
          .max(30)
          .regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets uniquement'),
        address: z.string().min(5),
        phone: z.string().min(8),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
})
