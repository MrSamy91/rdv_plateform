import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Mail } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { AuthShell } from '@/components/auth/auth-shell'
import { ResendVerificationEmailButton } from '@/components/auth/resend-verification-email-button'

interface Props {
  searchParams: Promise<{ email?: string }>
}

export const metadata: Metadata = {
  title: 'Verification email',
  description: 'Verifiez votre adresse email pour activer votre compte CutBook.',
  robots: { index: false },
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const session = await getSession()

  if (session?.user.emailVerified) {
    redirect('/client')
  }

  const { email } = await searchParams

  return (
    <AuthShell
      title="Verifiez votre email"
      description="Activez votre compte depuis le lien envoye par email."
      brandTitle="Votre espace est pret"
      brandHighlight="il reste l'email."
      brandDescription="La verification protege les comptes et limite les inscriptions abusives."
    >
      <div className="bg-card space-y-4 rounded-xl border p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
            <Mail className="text-primary size-8" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">Verifie ton email</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            On t&apos;a envoye un lien de confirmation. Clique dessus pour activer ton compte.
          </p>
        </div>

        <p className="text-muted-foreground text-xs">
          Pas recu ?{' '}
          <span className="text-foreground">
            Verifie tes spams ou{' '}
            <Link href="/register" className="text-primary hover:underline">
              reessaie avec un autre email
            </Link>
          </span>
        </p>

        <ResendVerificationEmailButton email={email} />
      </div>

      <p className="text-muted-foreground mt-8 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Retour a la connexion
        </Link>
      </p>
    </AuthShell>
  )
}
