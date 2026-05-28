// Helper partagé : résout l'organisation possédée par l'utilisateur courant (owner).
// "Être owner" = relation Organization.ownerId (pas un role plateforme).
// Dérivé du contexte (jamais d'orgId envoyé par le client) -> pas d'usurpation possible.
import { TRPCError } from '@trpc/server'

export async function getOwnedOrg(ctx: { db: typeof import('@/lib/db').db; user: { id: string } }) {
  const organization = await ctx.db.organization.findUnique({
    where: { ownerId: ctx.user.id },
    select: { id: true, name: true, slug: true, ownerId: true },
  })

  if (!organization) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Vous ne gerez aucune organisation.',
    })
  }

  return organization
}
