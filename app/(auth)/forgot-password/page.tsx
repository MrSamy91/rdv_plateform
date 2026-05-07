import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Mot de passe oublie',
  description: 'Reinitialisez votre mot de passe CutBook.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublie ?"
      description="Renseignez votre email pour recevoir un lien de reinitialisation."
      brandTitle="Recuperez votre acces"
      brandHighlight="en quelques minutes."
      brandDescription="Les liens de reinitialisation sont emis par BetterAuth et expirent automatiquement."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
