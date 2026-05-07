'use server'

import { getSession } from '@/lib/auth'
import type { ConfirmBookingActionState } from '@/lib/bookings/confirm-booking-action-state'
import { confirmPublicBooking } from '@/lib/bookings/public-booking'

export async function confirmBookingAction(
  _previousState: ConfirmBookingActionState,
  formData: FormData,
): Promise<ConfirmBookingActionState> {
  const session = await getSession()

  if (!session?.user.id) {
    return {
      status: 'error',
      message: 'Connectez-vous pour confirmer cette reservation.',
    }
  }

  const result = await confirmPublicBooking({
    orgSlug: String(formData.get('orgSlug') ?? ''),
    clientId: session.user.id,
    serviceId: String(formData.get('serviceId') ?? ''),
    memberId: String(formData.get('memberId') ?? ''),
    slotId: String(formData.get('slotId') ?? ''),
  })

  if (!result.ok) {
    return {
      status: 'error',
      message: result.message,
    }
  }

  return {
    status: 'success',
    message: 'Reservation confirmee.',
  }
}
