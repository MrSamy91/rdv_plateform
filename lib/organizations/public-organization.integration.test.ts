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
import { db } from '@/lib/db'
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
    // Le seed rich ajoute des services Nova supplementaires (Olaplex,
    // Permanente, etc.) : on verifie que les 3 services historiques sont au
    // moins listes, sans assertion stricte sur le set complet.
    expect(organization?.services.map((service) => service.name)).toEqual(
      expect.arrayContaining(Object.values(seedServices).map((service) => service.name)),
    )
    // Idem cote membres : seedMembers (nora/mila/leo) doit etre une borne
    // basse, mais les membres extras du seed rich rejoignent l'orga aussi.
    expect(organization?._count.members).toBeGreaterThanOrEqual(Object.values(seedMembers).length)
  })

  it('recupere une organisation publique par slug normalise', async () => {
    const organization = await getPublicOrganizationBySlug(`@${seedOrganization.slug}`)

    expect(organization?.slug).toBe(seedOrganization.slug)
    // Le seed rich rajoute Nora (owner-membre) et des coiffeurs supplementaires.
    // On verifie que les deux membres historiques (Leo, Mila) figurent toujours
    // dans la liste exposee publiquement, sans figer le set complet.
    expect(organization?.members.map((member) => member.user.name)).toEqual(
      expect.arrayContaining(['Leo Martin', 'Mila Laurent']),
    )
  })

  it('retourne null pour une organisation publique inconnue', async () => {
    await expect(getPublicOrganizationBySlug('orga-inconnue')).resolves.toBeNull()
  })

  it('liste tous les creneaux des membres de l organisation avec leur disponibilite', async () => {
    const slots = await listPublicOrganizationAvailableSlots(`@${seedOrganization.slug}`)
    const expectedAvailableSlots = buildSeedTimeSlots()
      .filter((slot) => slot.isAvailable !== false)
      .map((slot) => slot.id)
    const slotIds = Array.from(new Set(slots.map((slot) => slot.id)))

    // Le seed rich genere de nombreux creneaux libres supplementaires
    // (seed-slot-free-*, seed-slot-rich-*) : on verifie que les creneaux
    // historiques disponibles sont au moins exposes, plutot que d'imposer
    // un set strict.
    expect(slotIds).toEqual(expect.arrayContaining(expectedAvailableSlots))
    // Les creneaux historiques marques isAvailable=false (mila-1, leo-1) ne
    // doivent jamais ressortir : la query filtre isAvailable=true uniquement.
    const unavailableHistoricalSlots = buildSeedTimeSlots()
      .filter((slot) => slot.isAvailable === false)
      .map((slot) => slot.id)
    for (const unavailableId of unavailableHistoricalSlots) {
      expect(slotIds).not.toContain(unavailableId)
    }
    // Aucun slot retourne ne doit etre marque indisponible.
    expect(slots.filter((slot) => !slot.isAvailable)).toHaveLength(0)
    // Tous les slots remontent bien de l'orga ciblee.
    expect(slots.every((slot) => slot.member.organization.slug === seedOrganization.slug)).toBe(
      true,
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

    // Le seed rich attache la prestation "beard" a plusieurs membres Nova
    // (Leo + autres extras) : on ne peut plus pretendre que Leo est seul.
    // L'invariant a verifier est que tous les slots ressortent uniquement de
    // membres qui proposent reellement le service filtre.
    const eligibleMembers = await db.member.findMany({
      where: {
        organization: { slug: seedOrganization.slug },
        services: { some: { serviceId: seedServices.beard.id } },
      },
      select: { id: true },
    })
    const eligibleMemberIds = new Set(eligibleMembers.map((member) => member.id))

    expect(slots).not.toHaveLength(0)
    expect(eligibleMemberIds.has(seedMembers.leo.id)).toBe(true)
    expect(slots.every((slot) => eligibleMemberIds.has(slot.memberId))).toBe(true)
    // Au moins un slot Leo doit ressortir (membre historique du service).
    expect(slots.some((slot) => slot.memberId === seedMembers.leo.id)).toBe(true)
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

    // Incoherence service / orga : on prend un service rattache a une autre
    // organisation (Refuge) avec un slot Nova. Le seed rich attache toutes
    // les prestations Nova a Leo, donc on ne peut plus utiliser un service
    // Nova pour declencher la nullite ici.
    await expect(
      getPublicBookingConfirmationSummary(seedOrganization.slug, {
        serviceId: 'seed-service-barbershop-le-refuge-classic',
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
