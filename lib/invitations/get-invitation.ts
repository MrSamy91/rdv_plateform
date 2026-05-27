import { db } from '@/lib/db'

/**
 * Lecture d'une invitation par son token, pour la page d'acceptation (Server Component).
 * Retourne l'invitation + l'orga, ou null si le token est inconnu.
 */
export async function getInvitationByToken(token: string) {
  return await db.memberInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      status: true,
      expiresAt: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  })
}
