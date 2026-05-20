// @vitest-environment node

import 'dotenv/config'

import { beforeAll, describe, expect, it } from 'vitest'
import type { TRPCError } from '@trpc/server'
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

  async function createUserCaller(userId: string) {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } })
    const session = {
      id: `test-session-${user.id}`,
      token: `test-token-${user.id}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    }

    return appRouter.createCaller({
      db,
      session: { session, user },
      user,
    })
  }

  it('confirme un booking avec le client de la session tRPC', async () => {
    const caller = await createUserCaller(seedUsers.clientTwo.id)

    const result = await caller.booking.confirm({
      orgSlug: seedOrganization.slug,
      serviceId: seedServices.beard.id,
      memberId: seedMembers.leo.id,
      slotId: 'seed-slot-leo-2',
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

  it('garde confirmPublic comme alias temporaire', async () => {
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
      slotId: 'seed-slot-leo-3',
    })

    expect(result).toEqual({ bookingId: expect.any(String) })

    const booking = await db.booking.findUnique({
      where: { id: result.bookingId },
    })

    expect(booking?.clientId).toBe(seedUsers.clientTwo.id)
    expect(booking?.serviceId).toBe(seedServices.beard.id)
    expect(booking?.memberId).toBe(seedMembers.leo.id)
    expect(booking?.timeSlotId).toBe('seed-slot-leo-3')
  })

  it('annule un booking et libere le creneau associe', async () => {
    const caller = await createUserCaller(seedUsers.clientOne.id)

    const result = await caller.booking.cancel({ bookingId: 'seed-booking-confirmed' })

    expect(result).toEqual({
      bookingId: 'seed-booking-confirmed',
      status: 'CANCELLED',
    })

    const booking = await db.booking.findUniqueOrThrow({
      where: { id: 'seed-booking-confirmed' },
      include: { timeSlot: true },
    })

    expect(booking.status).toBe('CANCELLED')
    expect(booking.timeSlot.isAvailable).toBe(true)
  })

  it('refuse l annulation par un autre client', async () => {
    const caller = await createUserCaller(seedUsers.clientTwo.id)

    await expect(
      caller.booking.cancel({ bookingId: 'seed-booking-confirmed' }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN' satisfies TRPCError['code'],
    })
  })
})
