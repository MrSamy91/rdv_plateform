import { describe, expect, it } from 'vitest'
import {
  getPublicOrgBookingConfirmHref,
  getPublicOrgBookingHref,
  getPublicOrgBookingSlotHref,
  getPublicOrgHref,
  normalizePublicOrgSlug,
} from './organization-public-route'

describe('organization public routes', () => {
  it('normalise un slug public sans decorateur historique', () => {
    expect(normalizePublicOrgSlug('@atelier-nova')).toBe('atelier-nova')
    expect(normalizePublicOrgSlug('atelier-nova')).toBe('atelier-nova')
  })

  it('genere les urls publiques sans groupe route et sans arobase', () => {
    expect(getPublicOrgHref('@atelier-nova')).toBe('/atelier-nova')
    expect(getPublicOrgBookingHref('atelier-nova')).toBe('/atelier-nova/booking')
    expect(getPublicOrgBookingSlotHref('atelier-nova')).toBe('/atelier-nova/booking/slot')
    expect(getPublicOrgBookingSlotHref('atelier-nova', '?service=s1&member=m1')).toBe(
      '/atelier-nova/booking/slot?service=s1&member=m1',
    )
    expect(getPublicOrgBookingConfirmHref('atelier-nova', '?slot=seed-slot&time=09:00')).toBe(
      '/atelier-nova/booking/confirm?slot=seed-slot&time=09:00',
    )
    expect(
      getPublicOrgBookingConfirmHref('atelier-nova', {
        service: 's1',
        member: 'm1',
        slot: 'seed-slot',
        time: '09:00',
      }),
    ).toBe('/atelier-nova/booking/confirm?service=s1&member=m1&slot=seed-slot&time=09%3A00')
  })
})
