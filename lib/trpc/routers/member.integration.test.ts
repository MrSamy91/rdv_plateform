// @vitest-environment node

import 'dotenv/config'

import type { TRPCError } from '@trpc/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { runSeed, seedMembers, seedUsers } from '@/prisma/seed'
import { db } from '@/lib/db'
import { appRouter } from '.'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run integration tests')
}

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

describe('memberRouter integration', () => {
  beforeAll(async () => {
    await runSeed()
  }, 30_000)

  it('recupere le profil professionnel du membre connecte', async () => {
    const caller = await createUserCaller(seedUsers.memberOne.id)

    const profile = await caller.memberPortal.profile()

    expect(profile).toMatchObject({
      id: seedMembers.mila.id,
      name: seedUsers.memberOne.name,
      email: seedUsers.memberOne.email,
      organizationName: 'Atelier Nova',
      organizationSlug: 'atelier-nova',
      bio: seedMembers.mila.bio,
      specialties: seedMembers.mila.specialties,
      experience: seedMembers.mila.experience,
    })
  })

  it('retourne les stats dashboard du membre connecte', async () => {
    const caller = await createUserCaller(seedUsers.memberOne.id)

    const summary = await caller.memberPortal.dashboardSummary()

    expect(summary.profile.id).toBe(seedMembers.mila.id)
    expect(summary.todayBookingsCount).toBeGreaterThanOrEqual(0)
    expect(summary.weekBookingsCount).toBeGreaterThanOrEqual(1)
    expect(summary.monthClientsCount).toBeGreaterThanOrEqual(1)
    // Le seed rich genere des avis 3/4/5 etoiles randomises pour Mila en plus
    // de l'avis 5* historique : on ne peut plus pinpoint une valeur exacte,
    // mais la moyenne doit rester dans [1, 5] et au moins l'avis historique
    // doit etre comptabilise.
    expect(summary.averageRating ?? 0).toBeGreaterThanOrEqual(1)
    expect(summary.averageRating ?? 0).toBeLessThanOrEqual(5)
    expect(summary.reviewsCount).toBeGreaterThanOrEqual(1)
    expect(summary.nextBookings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'seed-booking-confirmed',
          client: seedUsers.clientOne.name,
          service: 'Coupe & brushing',
          status: 'CONFIRMED',
        }),
      ]),
    )
  })

  it('liste les rendez-vous calendrier du membre connecte', async () => {
    const caller = await createUserCaller(seedUsers.memberOne.id)

    const bookings = await caller.memberPortal.calendarBookings()

    expect(bookings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'seed-booking-confirmed',
          client: seedUsers.clientOne.name,
          service: 'Coupe & brushing',
          status: 'CONFIRMED',
          price: 55,
        }),
      ]),
    )
  })

  it('liste les creneaux du membre connecte', async () => {
    const caller = await createUserCaller(seedUsers.memberOne.id)

    const availability = await caller.memberPortal.availability()

    // Le seed rich ajoute des creneaux libres / reserves supplementaires pour
    // remplir le planning, donc les compteurs absolus ne sont plus stables.
    // On verifie au minimum que les creneaux historiques sont presents.
    expect(availability.availableCount).toBeGreaterThanOrEqual(2)
    expect(availability.bookedCount).toBeGreaterThanOrEqual(1)
    expect(availability.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'seed-slot-mila-1',
          startTime: '09:00',
          endTime: '10:00',
          isAvailable: false,
        }),
        expect.objectContaining({
          id: 'seed-slot-mila-2',
          startTime: '10:30',
          endTime: '11:30',
          isAvailable: true,
        }),
      ]),
    )
  })

  it('met a jour le profil professionnel du membre connecte', async () => {
    const caller = await createUserCaller(seedUsers.memberTwo.id)

    const result = await caller.memberPortal.updateProfile({
      bio: 'Bio test integration',
      specialties: 'Coupe test',
      experience: 9,
    })

    expect(result).toEqual({
      id: seedMembers.leo.id,
      bio: 'Bio test integration',
      specialties: 'Coupe test',
      experience: 9,
    })

    const member = await db.member.findUniqueOrThrow({
      where: { id: seedMembers.leo.id },
    })

    expect(member.bio).toBe('Bio test integration')
    expect(member.specialties).toBe('Coupe test')
    expect(member.experience).toBe(9)
  })

  it('refuse un utilisateur connecte sans profil member', async () => {
    const caller = await createUserCaller(seedUsers.clientOne.id)

    await expect(caller.memberPortal.profile()).rejects.toMatchObject({
      code: 'FORBIDDEN' satisfies TRPCError['code'],
      message: 'Aucun profil professionnel associe a cet utilisateur.',
    })
  })
})
