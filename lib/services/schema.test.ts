import { describe, expect, it } from 'vitest'
import { serviceInputSchema, updateServiceSchema, setServiceMembersSchema } from './schema'

const validInput = {
  orgId: 'org_1',
  name: 'Coupe femme',
  description: 'Shampoing + coupe',
  duration: 30,
  price: 25,
}

describe('serviceInputSchema', () => {
  it('accepte une création valide', () => {
    expect(serviceInputSchema.safeParse(validInput).success).toBe(true)
  })

  it('accepte une description nulle et des memberIds optionnels', () => {
    const result = serviceInputSchema.safeParse({
      ...validInput,
      description: null,
      memberIds: ['m1', 'm2'],
    })
    expect(result.success).toBe(true)
  })

  it('refuse un nom trop court', () => {
    expect(serviceInputSchema.safeParse({ ...validInput, name: 'A' }).success).toBe(false)
  })

  it('refuse une durée non entière ou sous le minimum', () => {
    expect(serviceInputSchema.safeParse({ ...validInput, duration: 30.5 }).success).toBe(false)
    expect(serviceInputSchema.safeParse({ ...validInput, duration: 4 }).success).toBe(false)
  })

  it('refuse un prix négatif ou hors plage', () => {
    expect(serviceInputSchema.safeParse({ ...validInput, price: -1 }).success).toBe(false)
    expect(serviceInputSchema.safeParse({ ...validInput, price: 10_001 }).success).toBe(false)
  })

  it('refuse un orgId vide', () => {
    expect(serviceInputSchema.safeParse({ ...validInput, orgId: '' }).success).toBe(false)
  })
})

describe('updateServiceSchema', () => {
  it('accepte une mise à jour partielle (un seul champ)', () => {
    expect(updateServiceSchema.safeParse({ serviceId: 's1', price: 30 }).success).toBe(true)
  })

  it('refuse une mise à jour sans aucun champ à modifier', () => {
    expect(updateServiceSchema.safeParse({ serviceId: 's1' }).success).toBe(false)
  })

  it('refuse une valeur invalide même en partiel', () => {
    expect(updateServiceSchema.safeParse({ serviceId: 's1', duration: 1 }).success).toBe(false)
  })
})

describe('setServiceMembersSchema', () => {
  it('accepte une liste de pros', () => {
    expect(
      setServiceMembersSchema.safeParse({ serviceId: 's1', memberIds: ['m1', 'm2'] }).success,
    ).toBe(true)
  })

  it('accepte une liste vide (retirer tous les pros)', () => {
    expect(setServiceMembersSchema.safeParse({ serviceId: 's1', memberIds: [] }).success).toBe(true)
  })

  it('refuse un serviceId manquant', () => {
    expect(setServiceMembersSchema.safeParse({ memberIds: ['m1'] }).success).toBe(false)
  })
})
