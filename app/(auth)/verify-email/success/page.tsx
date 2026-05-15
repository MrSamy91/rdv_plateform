import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { EmailVerificationSuccessRedirect } from '@/components/auth/email-verification-success-redirect'

export const metadata: Metadata = {
  title: 'Email verifie - CutBook',
  description: 'Votre adresse email est verifiee. Redirection vers votre espace CutBook.',
  robots: { index: false },
}

export default function VerifyEmailSuccessPage() {
  return (
    <AuthShell
      title="Verification terminee"
      description="Votre compte CutBook est maintenant actif."
      brandTitle="Bienvenue sur CutBook"
      brandHighlight="votre espace est pret."
      brandDescription="Vous pouvez maintenant gerer vos reservations, services et clients."
    >
      <EmailVerificationSuccessRedirect />
    </AuthShell>
  )
}
