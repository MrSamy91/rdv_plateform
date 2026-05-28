import { getServerAppUrl } from '@/lib/env'
import { MemberInvitationTemplate, sendEmail } from '@/lib/email'

interface SendMemberInvitationEmailInput {
  to: string
  orgName: string
  inviterName?: string | null
  token: string
}

/**
 * Envoie l'email d'invitation. **Best-effort** : un échec d'envoi (Mailpit/Resend KO)
 * ne doit pas faire échouer la création de l'invitation (ni casser les tests d'intégration).
 */
export async function sendMemberInvitationEmail({
  to,
  orgName,
  inviterName,
  token,
}: SendMemberInvitationEmailInput) {
  const acceptUrl = `${getServerAppUrl()}/client/become-member?token=${encodeURIComponent(token)}`

  try {
    await sendEmail({
      to,
      subject: `Invitation a rejoindre ${orgName} sur CutBook`,
      react: MemberInvitationTemplate({ orgName, inviterName, acceptUrl }),
      tags: [{ name: 'type', value: 'member-invitation' }],
    })
  } catch (error) {
    console.error('[invitation] envoi email echoue:', error)
  }
}
