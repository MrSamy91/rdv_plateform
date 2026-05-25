import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PublicBookingSelector } from './public-booking-selector'

const services = [
  {
    id: 'service-cut',
    name: 'Coupe',
    description: 'Coupe simple',
    duration: 30,
    price: 35,
  },
]

const members = [
  {
    id: 'member-mila',
    specialties: 'Coupe femme',
    services: [{ serviceId: 'service-cut' }],
    user: {
      name: 'Mila Laurent',
    },
  },
  {
    id: 'member-leo',
    specialties: 'Barbe',
    services: [{ serviceId: 'service-beard' }],
    user: {
      name: 'Leo Martin',
    },
  },
]

describe('PublicBookingSelector', () => {
  it('bloque le choix du creneau tant que service et professionnel ne sont pas selectionnes', async () => {
    const user = userEvent.setup()
    render(<PublicBookingSelector orgSlug="atelier-nova" services={services} members={members} />)

    const nextLink = screen.getByRole('link', { name: 'Choisir un creneau' })
    expect(nextLink).toHaveAttribute('aria-disabled', 'true')
    expect(nextLink).not.toHaveAttribute('href')

    await user.click(screen.getByRole('radio', { name: /Coupe simple/ }))
    expect(nextLink).toHaveAttribute('aria-disabled', 'true')
    expect(nextLink).not.toHaveAttribute('href')
    expect(screen.queryByLabelText(/Leo Martin/)).not.toBeInTheDocument()

    await user.click(screen.getByLabelText(/Mila Laurent/))
    const enabledNextLink = screen.getByRole('link', { name: 'Choisir un creneau' })
    expect(enabledNextLink).toHaveAttribute('aria-disabled', 'false')
    expect(enabledNextLink).toHaveAttribute(
      'href',
      '/atelier-nova/booking/slot?service=service-cut&member=member-mila',
    )
  })
})
