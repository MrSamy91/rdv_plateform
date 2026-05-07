import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Connexion - CutBook',
  description: 'Connectez-vous a votre espace CutBook.',
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Bon retour"
      description="Connectez-vous pour acceder a votre espace."
      brandTitle="Vos clients reservent"
      brandHighlight="meme quand vous dormez."
      brandDescription="Reservation en ligne, paiement Stripe et fidelite automatique."
    >
      <LoginForm />
    </AuthShell>
  )
}
