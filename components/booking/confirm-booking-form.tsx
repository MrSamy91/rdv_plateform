'use client'

import { useActionState, useOptimistic } from 'react'
import type { ConfirmBookingActionState } from '@/lib/bookings/confirm-booking-action-state'

interface ConfirmBookingFormProps {
  orgSlug: string
  serviceId?: string
  memberId?: string
  slotId?: string
  action: (
    previousState: ConfirmBookingActionState,
    formData: FormData,
  ) => Promise<ConfirmBookingActionState>
}

const initialState: ConfirmBookingActionState = {
  status: 'idle',
}

export function ConfirmBookingForm({
  orgSlug,
  serviceId,
  memberId,
  slotId,
  action,
}: ConfirmBookingFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [optimisticConfirming, setOptimisticConfirming] = useOptimistic(false)
  const isLocked = pending || optimisticConfirming || state.status === 'success'

  return (
    <form
      action={(formData) => {
        setOptimisticConfirming(true)
        formAction(formData)
      }}
      className="space-y-3"
    >
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="serviceId" value={serviceId ?? ''} />
      <input type="hidden" name="memberId" value={memberId ?? ''} />
      <input type="hidden" name="slotId" value={slotId ?? ''} />

      {state.message && (
        <p
          role="status"
          className={
            state.status === 'success'
              ? 'rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700'
              : 'rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700'
          }
        >
          {state.message}
        </p>
      )}

      <button
        id="confirm-booking-btn"
        type="submit"
        disabled={isLocked}
        aria-busy={pending || optimisticConfirming}
        className="bg-primary text-primary-foreground w-full rounded-lg px-6 py-3.5 text-sm font-bold transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-60"
      >
        {state.status === 'success'
          ? 'Reservation confirmee'
          : isLocked
            ? 'Confirmation...'
            : 'Confirmer la reservation'}
      </button>
    </form>
  )
}
