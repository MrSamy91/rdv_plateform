import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getInvitationByToken } from '@/lib/invitations/get-invitation'
import { getInvitationState } from '@/lib/invitations/state'
import { InvitationAcceptance } from '@/components/dashboard/invitation-acceptance'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export const metadata: Metadata = { title: 'Rejoindre une organisation - CutBook' }

export default async function BecomeMemberPage({ searchParams }: Props) {
  const { token } = await searchParams

  // callbackUrl conserve le token pour revenir ici après login.
  const callbackUrl = token
    ? `/client/become-member?token=${encodeURIComponent(token)}`
    : '/client/become-member'
  const session = await requireSession(callbackUrl)

  if (!token) {
    return <InvitationAcceptance state="INVALID" />
  }

  const invitation = await getInvitationByToken(token)
  if (!invitation) {
    return <InvitationAcceptance state="INVALID" />
  }

  // Un user ne peut être membre que d'une seule orga.
  const alreadyMember = Boolean(
    await db.member.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
  )

  const state = getInvitationState(invitation, session.user.email)

  return (
    <InvitationAcceptance
      state={state}
      token={token}
      orgName={invitation.organization.name}
      alreadyMember={alreadyMember}
    />
  )
}
