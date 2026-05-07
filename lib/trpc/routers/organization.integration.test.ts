// @vitest-environment node

import 'dotenv/config'

import type { TRPCError } from '@trpc/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { runSeed, seedOrganization, seedServices, seedUsers } from '@/prisma/seed'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run integration tests')
}

async function createAnonymousCaller() {
  const [{ db }, { appRouter }] = await Promise.all([import('@/lib/db'), import('./index')])

  return appRouter.createCaller({
    db,
    session: null,
    user: null,
  })
}

describe('organizationRouter integration', () => {
  beforeAll(async () => {
    await runSeed()
  })

  it('recupere une organisation publique par son slug avec ses services et membres', async () => {
    const caller = await createAnonymousCaller()
    const organization = await caller.organization.getBySlug({ slug: seedOrganization.slug })

    expect(organization.id).toBe(seedOrganization.id)
    expect(organization.name).toBe(seedOrganization.name)
    expect(organization.services.map((service) => service.name).sort()).toEqual(
      Object.values(seedServices)
        .map((service) => service.name)
        .sort(),
    )
    expect(organization.members.map((member) => member.user.name).sort()).toEqual([
      seedUsers.memberTwo.name,
      seedUsers.memberOne.name,
    ])
  })

  it('retourne NOT_FOUND pour un slug inconnu', async () => {
    const caller = await createAnonymousCaller()

    await expect(caller.organization.getBySlug({ slug: 'orga-inconnue' })).rejects.toMatchObject({
      code: 'NOT_FOUND' satisfies TRPCError['code'],
      message: 'Organisation introuvable',
    })
  })
})
