'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Building2, CheckCircle2, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import type { InvitationState } from '@/lib/invitations/state'

const C = {
  text: '#253122',
  muted: 'rgba(37,49,34,0.45)',
  border: 'rgba(37,49,34,0.10)',
  card: '#ffffff',
  bg: '#f9f7f3',
  green: '#489B6E',
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

  const accept = trpc.invitation.accept.useMutation({
    onSuccess: () => {
      router.push('/member')
      router.refresh()
    },
  })

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

            {accept.isError && (
              <div
                className="mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: C.redBg, color: C.red }}
              >
                <AlertCircle size={15} />
                {accept.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={() => token && accept.mutate({ token })}
              disabled={accept.isPending || accept.isSuccess}
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
    </div>
  )
}
