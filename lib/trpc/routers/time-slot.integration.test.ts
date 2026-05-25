// @vitest-environment node

import 'dotenv/config'

import type { TRPCError } from '@trpc/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { dayFromNow, runSeed, seedMembers, seedUsers } from '@/prisma/seed'
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

describe('timeSlotRouter integration', () => {
  beforeAll(async () => {
    await runSeed()
  }, 30_000)

  it('liste les creneaux du membre connecte', async () => {
    const caller = await createUserCaller(seedUsers.memberOne.id)

    const slots = await caller.timeSlot.listByMember({ memberId: seedMembers.mila.id })

    expect(slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'seed-slot-mila-1',
          isAvailable: false,
        }),
        expect.objectContaining({
          id: 'seed-slot-mila-2',
          isAvailable: true,
        }),
      ]),
    )
  })

  it('verifie la disponibilite reelle d un creneau', async () => {
    const caller = await createUserCaller(seedUsers.memberOne.id)

    await expect(
      caller.timeSlot.checkAvailability({ timeSlotId: 'seed-slot-mila-1' }),
    ).resolves.toEqual({
      timeSlotId: 'seed-slot-mila-1',
      isAvailable: false,
    })

    await expect(
      caller.timeSlot.checkAvailability({ timeSlotId: 'seed-slot-mila-2' }),
    ).resolves.toEqual({
      timeSlotId: 'seed-slot-mila-2',
      isAvailable: true,
    })
  })

  it('cree, met a jour puis supprime un creneau', async () => {
    const caller = await createUserCaller(seedUsers.memberOne.id)

    const created = await caller.timeSlot.create({
      memberId: seedMembers.mila.id,
      date: dayFromNow(7),
      startTime: '18:00',
      endTime: '19:00',
    })

    expect(created).toMatchObject({
      memberId: seedMembers.mila.id,
      startTime: '18:00',
      endTime: '19:00',
      isAvailable: true,
    })

    const updated = await caller.timeSlot.update({
      timeSlotId: created.id,
      startTime: '18:30',
      endTime: '19:30',
      isAvailable: false,
    })

    expect(updated).toMatchObject({
      id: created.id,
      startTime: '18:30',
      endTime: '19:30',
      isAvailable: false,
    })

    await expect(caller.timeSlot.delete({ timeSlotId: created.id })).resolves.toEqual({
      timeSlotId: created.id,
    })
  })

  it('refuse de supprimer un creneau lie a une reservation', async () => {
    const caller = await createUserCaller(seedUsers.owner.id)

    await expect(caller.timeSlot.delete({ timeSlotId: 'seed-slot-mila-1' })).rejects.toMatchObject({
      code: 'CONFLICT' satisfies TRPCError['code'],
    })
  })

  it('refuse la gestion des creneaux par un autre client', async () => {
    const caller = await createUserCaller(seedUsers.clientOne.id)

    await expect(
      caller.timeSlot.listByMember({ memberId: seedMembers.mila.id }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN' satisfies TRPCError['code'],
    })
  })
})
