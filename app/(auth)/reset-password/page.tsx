import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthShell } from '@/components/auth/auth-shell'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Reinitialiser le mot de passe',
  robots: { index: false },
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe securise d'au moins 8 caracteres."
      brandTitle="Securisez votre compte"
      brandHighlight="avant de reprendre."
      brandDescription="La reinitialisation utilise le token emis par BetterAuth dans le lien email."
    >
      <Suspense fallback={<div className="bg-muted h-32 animate-pulse rounded-md" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
