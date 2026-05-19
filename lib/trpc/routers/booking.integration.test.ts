// @vitest-environment node

import 'dotenv/config'

import { beforeAll, describe, expect, it } from 'vitest'
import { runSeed, seedMembers, seedOrganization, seedServices, seedUsers } from '@/prisma/seed'
import { resetPublicBookingRateLimit } from '@/lib/bookings/public-booking'
import { db } from '@/lib/db'
import { appRouter } from '.'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run integration tests')
}

describe('bookingRouter', () => {
  beforeAll(async () => {
    await runSeed()
    resetPublicBookingRateLimit()
  })

  it('confirme un booking avec le client de la session tRPC', async () => {
    const user = await db.user.findUniqueOrThrow({ where: { id: seedUsers.clientTwo.id } })
    const session = {
      id: 'test-session',
      token: 'test-token',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    }
    const caller = appRouter.createCaller({
      db,
      session: { session, user },
      user,
    })

    const result = await caller.booking.confirmPublic({
      orgSlug: seedOrganization.slug,
      serviceId: seedServices.beard.id,
      memberId: seedMembers.leo.id,
      slotId: 'seed-slot-leo-2',
      time: '09:30',
    })

    expect(result).toEqual({ bookingId: expect.any(String) })

    const booking = await db.booking.findUnique({
      where: { id: result.bookingId },
    })

    expect(booking?.clientId).toBe(seedUsers.clientTwo.id)
    expect(booking?.serviceId).toBe(seedServices.beard.id)
    expect(booking?.memberId).toBe(seedMembers.leo.id)
    expect(booking?.timeSlotId).toBe('seed-slot-leo-2')
  })
})
