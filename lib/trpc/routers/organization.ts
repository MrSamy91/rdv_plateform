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
      // Verifier que le slug n'est pas deja pris
      const existing = await ctx.db.organization.findUnique({ where: { slug: input.slug } })
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Slug deja utilise' })
      }

      return await ctx.db.organization.create({
        data: {
          ...input,
          ownerId: ctx.user.id,
        },
      })
    }),
})
