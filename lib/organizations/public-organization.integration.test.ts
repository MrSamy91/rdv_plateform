// @vitest-environment node

import 'dotenv/config'

import { beforeAll, describe, expect, it } from 'vitest'
import {
  buildSeedTimeSlots,
  runSeed,
  seedMembers,
  seedOrganization,
  seedServices,
} from '@/prisma/seed'
import {
  getPublicBookingConfirmationSummary,
  getPublicOrganizationBySlug,
  listPublicOrganizations,
  listPublicOrganizationAvailableSlots,
} from './public-organization'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run integration tests')
}

describe('public organization data', () => {
  beforeAll(async () => {
    await runSeed()
  })

  it('liste les organisations visibles avec leurs services et leur nombre de membres', async () => {
    const organizations = await listPublicOrganizations()
    const organization = organizations.find((item) => item.slug === seedOrganization.slug)

    expect(organization).toBeDefined()
    expect(organization?.name).toBe(seedOrganization.name)
    expect(organization?.services.map((service) => service.name).sort()).toEqual(
      Object.values(seedServices)
        .map((service) => service.name)
        .sort(),
    )
    expect(organization?._count.members).toBe(Object.values(seedMembers).length)
  })

  it('recupere une organisation publique par slug normalise', async () => {
    const organization = await getPublicOrganizationBySlug(`@${seedOrganization.slug}`)

    expect(organization?.slug).toBe(seedOrganization.slug)
    expect(organization?.members.map((member) => member.user.name).sort()).toEqual([
      'Leo Martin',
      'Mila Laurent',
    ])
  })

  it('retourne null pour une organisation publique inconnue', async () => {
    await expect(getPublicOrganizationBySlug('orga-inconnue')).resolves.toBeNull()
  })

  it('liste tous les creneaux des membres de l organisation avec leur disponibilite', async () => {
    const slots = await listPublicOrganizationAvailableSlots(`@${seedOrganization.slug}`)
    const expectedSlots = buildSeedTimeSlots()
      .map((slot) => slot.id)
      .sort()

    expect(slots.map((slot) => slot.id).sort()).toEqual(expectedSlots)
    expect(
      slots
        .filter((slot) => slot.isAvailable)
        .map((slot) => slot.id)
        .sort(),
    ).toEqual(
      buildSeedTimeSlots()
        .filter((slot) => slot.isAvailable !== false)
        .map((slot) => slot.id)
        .sort(),
    )
    expect(
      slots
        .filter((slot) => !slot.isAvailable)
        .map((slot) => slot.id)
        .sort(),
    ).toEqual(['seed-slot-leo-1', 'seed-slot-mila-1'])
    expect(slots.map((slot) => slot.member.organization.slug)).toEqual(
      expect.arrayContaining([seedOrganization.slug]),
    )
  })

  it('filtre les creneaux par membre selectionne', async () => {
    const slots = await listPublicOrganizationAvailableSlots(seedOrganization.slug, {
      memberId: seedMembers.mila.id,
    })

    expect(slots).not.toHaveLength(0)
    expect(slots.every((slot) => slot.memberId === seedMembers.mila.id)).toBe(true)
    expect(slots.map((slot) => slot.id)).not.toContain('seed-slot-leo-2')
  })

  it('filtre les creneaux par service selectionne', async () => {
    const slots = await listPublicOrganizationAvailableSlots(seedOrganization.slug, {
      serviceId: seedServices.beard.id,
    })

    expect(slots).not.toHaveLength(0)
    expect(slots.every((slot) => slot.memberId === seedMembers.leo.id)).toBe(true)
    expect(slots.map((slot) => slot.id)).not.toContain('seed-slot-mila-2')
  })

  it('retourne une liste vide pour les creneaux d une organisation inconnue', async () => {
    await expect(listPublicOrganizationAvailableSlots('orga-inconnue')).resolves.toEqual([])
  })

  it('construit le recapitulatif public avec le service, le professionnel et le creneau selectionnes', async () => {
    const summary = await getPublicBookingConfirmationSummary(seedOrganization.slug, {
      serviceId: seedServices.cut.id,
      memberId: seedMembers.mila.id,
      slotId: 'seed-slot-mila-2',
      time: '10:30',
    })

    expect(summary).toMatchObject({
      org: seedOrganization.name,
      orgSlug: seedOrganization.slug,
      service: seedServices.cut.name,
      member: 'Mila Laurent',
      time: '10:30',
      duration: seedServices.cut.duration,
      price: seedServices.cut.price,
    })
    expect(summary?.date).not.toBe('Prochaine date disponible')
  })

  it('refuse un recapitulatif public incomplet ou incoherent', async () => {
    await expect(
      getPublicBookingConfirmationSummary(seedOrganization.slug, {
        serviceId: seedServices.cut.id,
        memberId: seedMembers.mila.id,
      }),
    ).resolves.toBeNull()

    await expect(
      getPublicBookingConfirmationSummary(seedOrganization.slug, {
        serviceId: seedServices.cut.id,
        memberId: seedMembers.leo.id,
        slotId: 'seed-slot-leo-2',
      }),
    ).resolves.toBeNull()

    await expect(
      getPublicBookingConfirmationSummary(seedOrganization.slug, {
        serviceId: seedServices.cut.id,
        memberId: seedMembers.leo.id,
        slotId: 'seed-slot-mila-2',
      }),
    ).resolves.toBeNull()

    await expect(
      getPublicBookingConfirmationSummary(seedOrganization.slug, {
        serviceId: 'service-inconnu',
        memberId: seedMembers.mila.id,
        slotId: 'seed-slot-mila-2',
      }),
    ).resolves.toBeNull()
  })
})
