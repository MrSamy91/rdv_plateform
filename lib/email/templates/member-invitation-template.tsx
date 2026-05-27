import { Button, Link, Text } from '@react-email/components'
import { EmailShell, emailStyles } from './email-shell'

interface MemberInvitationTemplateProps {
  orgName: string
  inviterName?: string | null
  acceptUrl: string
}

const buttonStyle = {
  display: 'inline-block',
  borderRadius: '8px',
  backgroundColor: emailStyles.colors.green500,
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700',
  lineHeight: '1',
  padding: '14px 22px',
  textDecoration: 'none',
}

const linkStyle = {
  color: emailStyles.colors.green600,
  fontWeight: '600',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
}

export function MemberInvitationTemplate({
  orgName,
  inviterName,
  acceptUrl,
}: MemberInvitationTemplateProps) {
  const intro = inviterName
    ? `${inviterName} vous invite a rejoindre ${orgName} sur CutBook.`
    : `Vous etes invite a rejoindre ${orgName} sur CutBook.`

  return (
    <EmailShell
      preview={`Rejoignez ${orgName} sur CutBook`}
      eyebrow="Invitation equipe"
      title={`Rejoignez ${orgName}`}
    >
      <Text style={emailStyles.text}>Bonjour,</Text>
      <Text style={emailStyles.text}>
        {intro} En acceptant, vous devenez membre de l&apos;equipe et pourrez gerer votre planning
        et vos prestations.
      </Text>

      <Button href={acceptUrl} style={buttonStyle}>
        Accepter l&apos;invitation
      </Button>

      <Text style={emailStyles.mutedText}>
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :{' '}
        <Link href={acceptUrl} style={linkStyle}>
          {acceptUrl}
        </Link>
      </Text>

      <Text style={emailStyles.mutedText}>
        Ce lien expire dans 7 jours. Si vous n&apos;attendiez pas cette invitation, ignorez cet
        email.
      </Text>
    </EmailShell>
  )
}
