'use client'

import { useEffect, useState } from 'react'
import { Loader2, MailPlus } from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'

interface ResendVerificationEmailButtonProps {
  email?: string
}

const RESEND_DELAY_SECONDS = 60

export function ResendVerificationEmailButton({ email }: ResendVerificationEmailButtonProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(RESEND_DELAY_SECONDS)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const canResend = !!email && remainingSeconds === 0 && !isSending

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(seconds - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  async function resendEmail() {
    if (!email || !canResend) {
      return
    }

    setIsSending(true)
    setMessage(null)

    await authClient.sendVerificationEmail({
      email,
      callbackURL: '/verify-email/success',
      fetchOptions: {
        onSuccess: () => {
          setMessage('Email renvoye. Verifie ta boite de reception.')
          setRemainingSeconds(RESEND_DELAY_SECONDS)
          setIsSending(false)
        },
        onError: () => {
          setMessage("Impossible de renvoyer l'email pour le moment.")
          setIsSending(false)
        },
      },
    })
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!canResend}
        onClick={resendEmail}
      >
        {isSending ? (
          <>
            <Loader2 className="animate-spin" />
            Envoi en cours...
          </>
        ) : remainingSeconds > 0 ? (
          <>Renvoyer dans {remainingSeconds}s</>
        ) : (
          <>
            <MailPlus />
            Renvoyer le mail
          </>
        )}
      </Button>

      {!email && (
        <p className="text-muted-foreground text-xs">
          Reconnecte-toi pour relancer automatiquement l&apos;envoi.
        </p>
      )}

      {message && <p className="text-muted-foreground text-xs">{message}</p>}
    </div>
  )
}
