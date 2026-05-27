import { InvitationStatus } from '@/generated/prisma/enums'

export const INVITATION_TTL_DAYS = 7

// Date d'expiration = maintenant + TTL. Isolé ici pour rester la seule source de vérité du délai.
export function getInvitationExpiry(from: Date = new Date()): Date {
  const expiry = new Date(from)
  expiry.setDate(expiry.getDate() + INVITATION_TTL_DAYS)
  return expiry
}

export type InvitationState = 'VALID' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED' | 'WRONG_RECIPIENT'

interface InvitationStateInput {
  status: InvitationStatus
  expiresAt: Date
  email: string
}

/**
 * Logique PURE (sans BDD) : décide l'état d'une invitation pour un user donné.
 * Réutilisée par `invitation.accept` (serveur) ET la page d'acceptation become-member.
 * Ordre de priorité : ACCEPTED > REVOKED > EXPIRED > WRONG_RECIPIENT > VALID.
 */
export function getInvitationState(
  invitation: InvitationStateInput,
  userEmail: string,
  now: Date = new Date(),
): InvitationState {
  if (invitation.status === InvitationStatus.ACCEPTED) return 'ACCEPTED'
  if (invitation.status === InvitationStatus.REVOKED) return 'REVOKED'
  if (invitation.expiresAt.getTime() < now.getTime()) return 'EXPIRED'
  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) return 'WRONG_RECIPIENT'
  return 'VALID'
}
