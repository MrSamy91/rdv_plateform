import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Creer un compte - CutBook',
  description: 'Creez votre espace CutBook et demarrez la reservation en ligne.',
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Creer mon espace"
      description="Gratuit. Aucune carte bancaire requise."
      brandTitle="Rejoignez les professionnels"
      brandHighlight="qui ont digitalise leur salon."
      brandDescription="Ouvrez votre espace, configurez vos services et recevez vos premieres reservations."
      brandStats={[
        { value: '100%', label: 'gratuit au depart' },
        { value: '24/7', label: 'reservations actives' },
        { value: '0 EUR', label: 'sans carte bancaire' },
      ]}
    >
      <RegisterForm />
    </AuthShell>
  )
}
