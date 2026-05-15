'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const REDIRECT_DELAY_SECONDS = 5

export function EmailVerificationSuccessRedirect() {
  const [remainingSeconds, setRemainingSeconds] = useState(REDIRECT_DELAY_SECONDS)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(seconds - 1, 0))
    }, 1000)

    const redirect = window.setTimeout(() => {
      window.location.href = '/client'
    }, REDIRECT_DELAY_SECONDS * 1000)

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(redirect)
    }
  }, [])

  return (
    <div className="bg-card space-y-4 rounded-xl border p-8 text-center shadow-sm">
      <div className="flex justify-center">
        <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="text-primary size-8" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Email verifie</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Ton compte est active. Redirection vers ton espace dans {remainingSeconds}s.
        </p>
      </div>
    </div>
  )
}
