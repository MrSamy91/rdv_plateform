import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PublicSlotPicker } from './public-slot-picker'

const dates = [
  { key: '2026-05-08', weekday: 'ven', day: '08', isAvailable: false },
  { key: '2026-05-09', weekday: 'sam', day: '09', isAvailable: true },
]

const slots = [
  {
    id: 'slot-unavailable',
    dateKey: '2026-05-08',
    startTime: '09:00',
    endTime: '09:30',
    isAvailable: false,
    memberName: 'Mila Laurent',
  },
  {
    id: 'slot-available',
    dateKey: '2026-05-09',
    startTime: '10:00',
    endTime: '10:30',
    isAvailable: true,
    memberName: 'Mila Laurent',
  },
]

describe('PublicSlotPicker', () => {
  it('affiche les jours indisponibles grises et filtre les creneaux par jour actif', async () => {
    const user = userEvent.setup()

    render(
      <PublicSlotPicker
        orgSlug="atelier-nova"
        serviceId="service-cut"
        memberId="member-mila"
        dates={dates}
        slots={slots}
      />,
    )

    const unavailableDay = screen.getByRole('button', { name: /ven08/i })
    expect(unavailableDay).toBeDisabled()
    expect(unavailableDay).toHaveClass('line-through')

    const availableDay = screen.getByRole('button', { name: /sam09/i })
    expect(availableDay).not.toBeDisabled()
    expect(availableDay).toHaveClass('hover:bg-green-600')

    expect(screen.queryByText('09:00')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '10:00' })).toHaveAttribute(
      'href',
      '/atelier-nova/booking/confirm?service=service-cut&member=member-mila&slot=slot-available&time=10%3A00',
    )

    await user.click(availableDay)
    expect(screen.getByRole('link', { name: '10:00' })).toBeVisible()
  })
})
