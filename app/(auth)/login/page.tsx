import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>
}

export const metadata: Metadata = {
  title: 'Connexion - CutBook',
  description: 'Connectez-vous a votre espace CutBook.',
}

function normalizeCallbackUrl(callbackUrl?: string) {
  if (!callbackUrl) {
    return '/client'
  }

  return callbackUrl.startsWith('/') ? callbackUrl : '/client'
}

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams

  return (
    <AuthShell
      title="Bon retour"
      description="Connectez-vous pour acceder a votre espace."
      brandTitle="Vos clients reservent"
      brandHighlight="meme quand vous dormez."
      brandDescription="Reservation en ligne, paiement Stripe et fidelite automatique."
    >
      <LoginForm callbackUrl={normalizeCallbackUrl(callbackUrl)} />
    </AuthShell>
  )
}
