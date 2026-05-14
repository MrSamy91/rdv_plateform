import { Button, Link, Text } from '@react-email/components'
import { EmailShell, emailStyles } from './email-shell'

interface VerifyEmailTemplateProps {
  name?: string | null
  verificationUrl: string
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

export function VerifyEmailTemplate({ name, verificationUrl }: VerifyEmailTemplateProps) {
  const greeting = name ? `Bonjour ${name},` : 'Bonjour,'

  return (
    <EmailShell
      preview="Confirme ton adresse email pour activer ton espace CutBook."
      eyebrow="Verification email"
      title="Confirme ton adresse email"
    >
      <Text style={emailStyles.text}>{greeting}</Text>
      <Text style={emailStyles.text}>
        Clique sur le bouton ci-dessous pour verifier ton adresse email et securiser ton compte.
      </Text>

      <Button href={verificationUrl} style={buttonStyle}>
        Verifier mon email
      </Button>

      <Text style={emailStyles.mutedText}>
        Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :{' '}
        <Link href={verificationUrl} style={linkStyle}>
          {verificationUrl}
        </Link>
      </Text>

      <Text style={emailStyles.mutedText}>
        Si tu n&apos;es pas a l&apos;origine de cette demande, tu peux ignorer cet email.
      </Text>
    </EmailShell>
  )
}
