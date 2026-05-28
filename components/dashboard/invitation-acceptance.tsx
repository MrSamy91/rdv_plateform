'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Building2, CheckCircle2, Loader2, PartyPopper } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import type { InvitationState } from '@/lib/invitations/state'

const C = {
  text: '#253122',
  muted: 'rgba(37,49,34,0.45)',
  border: 'rgba(37,49,34,0.10)',
  card: '#ffffff',
  bg: '#f9f7f3',
  green: '#489B6E',
  greenBg: 'rgba(72,155,110,0.12)',
  greenDark: '#2d6b4a',
  red: '#dc2626',
  redBg: 'rgba(220,38,38,0.08)',
}

interface InvitationAcceptanceProps {
  state: InvitationState | 'INVALID'
  token?: string
  orgName?: string
  alreadyMember?: boolean
}

// Messages pour les états non-acceptables.
const ERROR_MESSAGES: Record<Exclude<InvitationState, 'VALID'> | 'INVALID', string> = {
  INVALID: 'Lien d’invitation invalide ou incomplet.',
  EXPIRED: 'Cette invitation a expiré.',
  REVOKED: 'Cette invitation a été révoquée.',
  DECLINED: 'Vous avez refusé cette invitation.',
  ACCEPTED: 'Cette invitation a déjà été acceptée.',
  WRONG_RECIPIENT: 'Cette invitation ne correspond pas à votre compte.',
}

export function InvitationAcceptance({
  state,
  token,
  orgName,
  alreadyMember,
}: InvitationAcceptanceProps) {
  const router = useRouter()
  const [secondsLeft, setSecondsLeft] = useState(5)

  // Pas de redirection immédiate : on affiche une modal de félicitations + décompte.
  const accept = trpc.invitation.accept.useMutation()

  // Décompte de 5s après l'acceptation, puis redirection vers l'espace membre.
  useEffect(() => {
    if (!accept.isSuccess) return

    if (secondsLeft <= 0) {
      router.push('/member')
      router.refresh()
      return
    }

    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [accept.isSuccess, secondsLeft, router])

  const decline = trpc.invitation.decline.useMutation({
    onSuccess: () => {
      router.push('/client')
      router.refresh()
    },
  })

  const busy = accept.isPending || accept.isSuccess || decline.isPending || decline.isSuccess
  const canAccept = state === 'VALID' && !alreadyMember && Boolean(token)

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center px-4 py-16"
      style={{ background: C.bg }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-8 text-center"
        style={{ borderColor: C.border, background: C.card }}
      >
        <div
          className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl"
          style={{ background: C.green }}
        >
          <Building2 size={28} className="text-white" />
        </div>

        {canAccept ? (
          <>
            <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>
              Rejoindre {orgName}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: C.muted }}>
              Vous êtes invité à rejoindre <strong>{orgName}</strong> en tant que professionnel. En
              acceptant, vous accédez à votre espace membre (planning, prestations).
            </p>

            {(accept.isError || decline.isError) && (
              <div
                className="mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: C.redBg, color: C.red }}
              >
                <AlertCircle size={15} />
                {(accept.error ?? decline.error)?.message}
              </div>
            )}

            <button
              type="button"
              onClick={() => token && accept.mutate({ token })}
              disabled={busy}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: C.green }}
            >
              {accept.isPending && <Loader2 size={15} className="animate-spin" />}
              {accept.isSuccess ? (
                <>
                  <CheckCircle2 size={15} /> Bienvenue dans l’équipe !
                </>
              ) : accept.isPending ? (
                'Acceptation…'
              ) : (
                'Accepter l’invitation'
              )}
            </button>

            <button
              type="button"
              onClick={() => token && decline.mutate({ token })}
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ color: C.muted }}
            >
              {decline.isPending ? 'Refus…' : 'Refuser l’invitation'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>
              Invitation indisponible
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: C.muted }}>
              {alreadyMember && state === 'VALID'
                ? 'Vous êtes déjà membre d’une organisation.'
                : ERROR_MESSAGES[state === 'VALID' ? 'INVALID' : state]}
            </p>
            <Link
              href="/client"
              className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: C.green }}
            >
              Retour à mon espace
            </Link>
          </>
        )}
      </div>

      {/* Modal de félicitations + décompte avant redirection */}
      {accept.isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl"
            style={{ background: C.card }}
          >
            <div
              className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
              style={{ background: C.greenBg }}
            >
              <PartyPopper size={30} style={{ color: C.green }} />
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: C.text }}>
              Félicitations !
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: C.muted }}>
              Vous avez rejoint <strong>{orgName}</strong>. Bienvenue dans l’équipe !
            </p>
            <p className="mt-5 text-sm font-semibold" style={{ color: C.green }}>
              Redirection vers votre espace dans {secondsLeft}s…
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
