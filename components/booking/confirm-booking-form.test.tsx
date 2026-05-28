import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routerReplace } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
}))

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      booking: {
        publicSlots: {
          invalidate: vi.fn(),
        },
      },
    }),
    booking: {
      confirmPublic: {
        useMutation: (options: {
          onSuccess?: (data: { bookingId: string }) => void
          onError?: (error: { data?: { code?: string }; message: string }) => void
        }) => {
          return {
            mutate: () => {
              options?.onSuccess?.({ bookingId: 'b1' })
            },
            isPending: false,
          }
        },
      },
    },
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: routerReplace,
  }),
}))

import { ConfirmBookingForm } from './confirm-booking-form'

describe('ConfirmBookingForm', () => {
  beforeEach(() => {
    routerReplace.mockReset()
    window.history.pushState(
      {},
      '',
      '/atelier-nova/booking/confirm?service=s1&member=m1&slot=slot-1&time=09:00',
    )
  })

  it('redirige vers la page de paiement apres confirmation', () => {
    render(
      <ConfirmBookingForm
        orgSlug="atelier-nova"
        serviceId="s1"
        memberId="m1"
        slotId="slot-1"
        time="09:00"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la reservation' }))
    expect(screen.getByRole('status')).toHaveTextContent('Reservation confirmee.')

    // Paiement optionnel : on enchaine sur l'etape paiement avec le bookingId.
    expect(routerReplace).toHaveBeenCalledWith('/atelier-nova/booking/payment?booking=b1')
  })
})
