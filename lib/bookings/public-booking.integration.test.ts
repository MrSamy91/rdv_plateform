// @vitest-environment node

import 'dotenv/config'

import { beforeAll, describe, expect, it } from 'vitest'
import { runSeed, seedMembers, seedOrganization, seedServices, seedUsers } from '@/prisma/seed'
import { db } from '@/lib/db'
import { BookingStatus } from '@/generated/prisma/enums'
import { confirmPublicBooking, resetPublicBookingRateLimit } from './public-booking'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run integration tests')
}

describe('confirmPublicBooking', () => {
  beforeAll(async () => {
    await runSeed()
  })

  it('cree une reservation et rend le creneau indisponible dans une transaction', async () => {
    resetPublicBookingRateLimit()

    const result = await confirmPublicBooking({
      orgSlug: seedOrganization.slug,
      clientId: seedUsers.clientOne.id,
      serviceId: seedServices.cut.id,
      memberId: seedMembers.mila.id,
      slotId: 'seed-slot-mila-2',
      time: '10:30',
    })

    expect(result).toEqual({ ok: true, bookingId: expect.any(String) })

    const booking = await db.booking.findUnique({
      where: { id: result.ok ? result.bookingId : '' },
    })
    const slot = await db.timeSlot.findUnique({ where: { id: 'seed-slot-mila-2' } })

    expect(booking).toMatchObject({
      clientId: seedUsers.clientOne.id,
      memberId: seedMembers.mila.id,
      serviceId: seedServices.cut.id,
      timeSlotId: 'seed-slot-mila-2',
      status: BookingStatus.CONFIRMED,
      totalPrice: seedServices.cut.price,
    })
    expect(slot?.isAvailable).toBe(false)
  })

  it('refuse une double reservation du meme creneau', async () => {
    resetPublicBookingRateLimit()

    await expect(
      confirmPublicBooking({
        orgSlug: seedOrganization.slug,
        clientId: seedUsers.clientOne.id,
        serviceId: seedServices.beard.id,
        memberId: seedMembers.leo.id,
        slotId: 'seed-slot-leo-1',
        time: '11:00',
      }),
    ).resolves.toEqual({
      ok: false,
      code: 'SLOT_UNAVAILABLE',
      message: 'Ce creneau nest plus disponible.',
    })
  })

  it('refuse un service non propose par le professionnel choisi', async () => {
    resetPublicBookingRateLimit()

    await expect(
      confirmPublicBooking({
        orgSlug: seedOrganization.slug,
        clientId: seedUsers.clientOne.id,
        serviceId: seedServices.cut.id,
        memberId: seedMembers.leo.id,
        slotId: 'seed-slot-leo-2',
        time: '09:30',
      }),
    ).resolves.toEqual({
      ok: false,
      code: 'SLOT_UNAVAILABLE',
      message: 'Ce creneau nest plus disponible.',
    })
  })

  it('rate limit les confirmations repetees par client', async () => {
    resetPublicBookingRateLimit()

    const input = {
      orgSlug: seedOrganization.slug,
      clientId: seedUsers.clientTwo.id,
      serviceId: seedServices.cut.id,
      memberId: seedMembers.mila.id,
      slotId: 'seed-slot-mila-1',
      time: '09:00',
    }

    await confirmPublicBooking(input)
    await confirmPublicBooking(input)
    await confirmPublicBooking(input)

    await expect(confirmPublicBooking(input)).resolves.toEqual({
      ok: false,
      code: 'RATE_LIMITED',
      message: 'Trop de tentatives. Réessayez dans une minute.',
    })
  })
})
