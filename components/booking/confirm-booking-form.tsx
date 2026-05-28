'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPublicOrgBookingPaymentHref } from '@/lib/routes/organization-public-route'
import { trpc } from '@/lib/trpc/client'

interface ConfirmBookingFormProps {
  orgSlug: string
  serviceId: string
  memberId: string
  slotId: string
  time: string
}

export function ConfirmBookingForm({
  orgSlug,
  serviceId,
  memberId,
  slotId,
  time,
}: ConfirmBookingFormProps) {
  const [message, setMessage] = useState<string>()
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [optimisticConfirming, setOptimisticConfirming] = useState(false)
  const router = useRouter()
  const utils = trpc.useUtils()

  const confirmBooking = trpc.booking.confirmPublic.useMutation({
    onSuccess(data) {
      setIsConfirmed(true)
      setMessage('Reservation confirmee. Redirection vers le paiement...')
      // Le créneau réservé n'est plus dispo : on invalide la liste pour CE client
      // (utile s'il revient en arrière sur la page de sélection).
      void utils.booking.publicSlots.invalidate()
      // Paiement optionnel : on enchaine sur l'etape paiement (skippable la-bas).
      router.replace(getPublicOrgBookingPaymentHref(orgSlug, { booking: data.bookingId }))
    },
    onError(error) {
      setOptimisticConfirming(false)
      if (error.data?.code === 'UNAUTHORIZED') {
        const callbackUrl = `${window.location.pathname}${window.location.search}`
        window.location.assign(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }
      setMessage(error.message)
    },
  })
  const isLocked = confirmBooking.isPending || optimisticConfirming || isConfirmed

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()

        if (isLocked) {
          return
        }

        setOptimisticConfirming(true)
        confirmBooking.mutate({
          orgSlug,
          serviceId,
          memberId,
          slotId,
          time,
        })
      }}
      className="space-y-3"
    >
      {message && (
        <p
          role="status"
          className={
            isConfirmed
              ? 'rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700'
              : 'rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700'
          }
        >
          {message}
        </p>
      )}

      <button
        id="confirm-booking-btn"
        type="submit"
        disabled={isLocked}
        aria-busy={confirmBooking.isPending || optimisticConfirming}
        className="bg-primary text-primary-foreground w-full rounded-lg px-6 py-3.5 text-sm font-bold transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-60"
      >
        {isConfirmed
          ? 'Reservation confirmee'
          : isLocked
            ? 'Confirmation...'
            : 'Confirmer la reservation'}
      </button>
    </form>
  )
}
