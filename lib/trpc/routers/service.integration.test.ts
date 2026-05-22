// @vitest-environment node

import 'dotenv/config'

import type { TRPCError } from '@trpc/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { runSeed, seedMembers, seedOrganization, seedServices, seedUsers } from '@/prisma/seed'
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

describe('serviceRouter integration', () => {
  beforeAll(async () => {
    await runSeed()
  }, 30_000)

  it('liste les services du salon pour le owner', async () => {
    const caller = await createUserCaller(seedUsers.owner.id)

    const services = await caller.service.listByOrganization({ orgId: seedOrganization.id })

    expect(services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: seedServices.cut.id,
          name: seedServices.cut.name,
        }),
      ]),
    )
  })

  it('cree, met a jour puis supprime un service owner-only', async () => {
    const caller = await createUserCaller(seedUsers.owner.id)

    const created = await caller.service.create({
      orgId: seedOrganization.id,
      name: 'Soin profond',
      description: 'Soin cheveux test integration',
      duration: 30,
      price: 35,
      memberIds: [seedMembers.mila.id],
    })

    expect(created).toMatchObject({
      orgId: seedOrganization.id,
      name: 'Soin profond',
      price: 35,
    })
    expect(created.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memberId: seedMembers.mila.id,
        }),
      ]),
    )

    const updated = await caller.service.update({
      serviceId: created.id,
      name: 'Soin profond premium',
      price: 45,
    })

    expect(updated).toMatchObject({
      id: created.id,
      name: 'Soin profond premium',
      price: 45,
    })

    await expect(caller.service.delete({ serviceId: created.id })).resolves.toEqual({
      serviceId: created.id,
    })
  })

  it('refuse la creation de service par un membre', async () => {
    const caller = await createUserCaller(seedUsers.memberOne.id)

    await expect(
      caller.service.create({
        orgId: seedOrganization.id,
        name: 'Service interdit',
        duration: 30,
        price: 20,
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN' satisfies TRPCError['code'],
    })
  })

  it('permet au membre de choisir les services qu il propose', async () => {
    const caller = await createUserCaller(seedUsers.memberOne.id)

    const result = await caller.service.setMemberServices({
      memberId: seedMembers.mila.id,
      serviceIds: [seedServices.cut.id, seedServices.color.id],
    })

    expect(result).toEqual({
      memberId: seedMembers.mila.id,
      serviceIds: [seedServices.cut.id, seedServices.color.id],
    })

    const memberServices = await db.memberService.findMany({
      where: { memberId: seedMembers.mila.id },
      orderBy: { serviceId: 'asc' },
    })

    expect(memberServices.map((memberService) => memberService.serviceId).sort()).toEqual([
      seedServices.color.id,
      seedServices.cut.id,
    ])
  })
})
