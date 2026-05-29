import { BookingStatus, RewardStatus, Role } from '@/generated/prisma/client'
import { describe, expect, it } from 'vitest'
import {
  buildSeedBookings,
  buildSeedMemberServices,
  buildSeedRewards,
  buildSeedTimeSlots,
  defaultSeedPassword,
  seedMembers,
  seedOrganization,
  seedServices,
  seedUsers,
} from './seed'

describe('seed fixtures', () => {
  it('cree une organisation demo avec owner, members, clients et services coherents', () => {
    expect(seedOrganization.slug).toBe('atelier-nova')

    // role = identite plateforme : tous CLIENT (aucun admin dans le seed).
    for (const user of Object.values(seedUsers)) {
      expect(user.role).toBe(Role.CLIENT)
    }

    // owner / member sont des relations, pas des roles :
    // - Mila et Leo sont les praticiens employes -> lignes Member
    // - Nora cumule owner (Organization.ownerId) ET member (ligne Member) :
    //   invariant garanti par la procedure tRPC createOrganization qui cree
    //   toujours une fiche Member pour le createur de l'orga.
    const memberUserIds = Object.values(seedMembers).map((member) => member.userId)
    expect(memberUserIds).toContain(seedUsers.owner.id)
    expect(memberUserIds).toContain(seedUsers.memberOne.id)
    expect(memberUserIds).toContain(seedUsers.memberTwo.id)

    expect(seedMembers.nora.userId).toBe(seedUsers.owner.id)
    expect(seedMembers.mila.userId).toBe(seedUsers.memberOne.id)
    expect(seedMembers.leo.userId).toBe(seedUsers.memberTwo.id)
    expect(Object.values(seedServices)).toHaveLength(3)
  })

  it('garde des identifiants seed uniques pour eviter les collisions idempotentes', () => {
    const ids = [
      ...Object.values(seedUsers).map((user) => user.id),
      seedOrganization.id,
      ...Object.values(seedMembers).map((member) => member.id),
      ...Object.values(seedServices).map((service) => service.id),
      ...buildSeedMemberServices().map(({ memberId, serviceId }) => `${memberId}:${serviceId}`),
      ...buildSeedTimeSlots().map((slot) => slot.id),
      ...buildSeedBookings().map((booking) => booking.id),
      ...buildSeedRewards().map((reward) => reward.id),
    ]

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('reserve uniquement des creneaux marques indisponibles', () => {
    const slotsById = new Map(buildSeedTimeSlots().map((slot) => [slot.id, slot]))

    for (const booking of buildSeedBookings()) {
      const slot = slotsById.get(booking.timeSlotId)

      expect(slot).toBeDefined()
      expect(slot?.memberId).toBe(booking.memberId)
      expect(slot?.isAvailable).toBe(false)
    }
  })

  it('utilise les prix des services pour les bookings demo', () => {
    const servicesById = new Map(
      Object.values(seedServices).map((service) => [service.id, service]),
    )

    for (const booking of buildSeedBookings()) {
      const service = servicesById.get(booking.serviceId)

      expect(service).toBeDefined()
      expect(booking.totalPrice).toBe(service?.price)
    }
  })

  it('associe chaque booking demo a un service propose par le membre', () => {
    const memberServiceKeys = new Set(
      buildSeedMemberServices().map(({ memberId, serviceId }) => `${memberId}:${serviceId}`),
    )

    for (const booking of buildSeedBookings()) {
      expect(memberServiceKeys.has(`${booking.memberId}:${booking.serviceId}`)).toBe(true)
    }
  })

  it('couvre les statuts utiles pour booking et fidelite', () => {
    expect(buildSeedBookings().map((booking) => booking.status)).toEqual([
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
    ])
    expect(buildSeedRewards().map((reward) => reward.status)).toEqual([
      RewardStatus.AVAILABLE,
      RewardStatus.USED,
    ])
  })

  it('documente un mot de passe demo uniquement pour les comptes seed', () => {
    expect(defaultSeedPassword).toHaveLength(15)
    expect(defaultSeedPassword).toMatch(/[A-Z]/)
    expect(defaultSeedPassword).toMatch(/[a-z]/)
    expect(defaultSeedPassword).toMatch(/[0-9]/)
    expect(defaultSeedPassword).toMatch(/[^A-Za-z0-9]/)
  })
})
