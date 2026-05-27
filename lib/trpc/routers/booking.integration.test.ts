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

  // Caller public (sans session) : la page de réservation est accessible sans login.
  const publicCaller = appRouter.createCaller({ db, session: null, user: null })

  const slotDurationMinutes = (slot: { startTime: string; endTime: string }) => {
    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return (h || 0) * 60 + (m || 0)
    }
    return toMins(slot.endTime) - toMins(slot.startTime)
  }

  it('expose les creneaux publics filtres par membre et service', async () => {
    const result = await publicCaller.booking.publicSlots({
      orgSlug: seedOrganization.slug,
      memberId: seedMembers.mila.id,
      serviceId: seedServices.cut.id,
    })

    expect(result.slots.length).toBeGreaterThan(0)
    // Tous les creneaux renvoyes sont libres (le creneau deja reserve est exclu).
    expect(result.slots.every((slot) => slot.isAvailable)).toBe(true)
    expect(result.slots.every((slot) => slot.memberName === 'Mila Laurent')).toBe(true)
    // Sous-creneaux generes a la duree du service (cut = 60 min).
    expect(
      result.slots.every((slot) => slotDurationMinutes(slot) === seedServices.cut.duration),
    ).toBe(true)
    // Les dates affichees correspondent exactement aux jours des creneaux.
    const slotDateKeys = new Set(result.slots.map((slot) => slot.dateKey))
    const dateKeys = new Set(result.dates.map((date) => date.key))
    expect(dateKeys).toEqual(slotDateKeys)
  })

  it('ne renvoie aucun creneau pour un service que le membre ne propose pas', async () => {
    // Mila ne fait pas "beard" (service de Leo) -> filtrage member-service cote serveur.
    const result = await publicCaller.booking.publicSlots({
      orgSlug: seedOrganization.slug,
      memberId: seedMembers.mila.id,
      serviceId: seedServices.beard.id,
    })

    expect(result.slots).toHaveLength(0)
  })

  it('confirme un booking avec le client de la session tRPC', async () => {
    const caller = await createUserCaller(seedUsers.clientTwo.id)

    const result = await caller.booking.confirm({
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
      time: '15:00',
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
