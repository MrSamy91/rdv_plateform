import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routerReplace } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
}))

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    booking: {
      confirmPublic: {
        useMutation: (options: {
          onSuccess?: () => void
          onError?: (error: { data?: { code?: string }; message: string }) => void
        }) => {
          return {
            mutate: () => {
              options?.onSuccess?.()
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
    vi.useFakeTimers()
    window.history.pushState(
      {},
      '',
      '/atelier-nova/booking/confirm?service=s1&member=m1&slot=slot-1&time=09:00',
    )
  })

  it('redirige vers les reservations client cinq secondes apres confirmation', async () => {
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

    await vi.advanceTimersByTimeAsync(5000)
    expect(routerReplace).toHaveBeenCalledWith('/client/bookings')
  })
})
