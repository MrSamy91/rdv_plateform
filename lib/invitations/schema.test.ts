import { describe, expect, it } from 'vitest'
import { recruitEmailSchema } from './schema'

describe('recruitEmailSchema', () => {
  it('accepte un email valide', () => {
    expect(recruitEmailSchema.safeParse({ email: 'client@cutbook.test' }).success).toBe(true)
  })

  it('refuse un email mal formé', () => {
    expect(recruitEmailSchema.safeParse({ email: 'pas-un-email' }).success).toBe(false)
  })

  it('refuse un email vide', () => {
    expect(recruitEmailSchema.safeParse({ email: '' }).success).toBe(false)
  })
})
