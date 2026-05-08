import { describe, expect, it } from 'vitest'
import { listPublicSlotDates } from './public-slot-dates'

describe('listPublicSlotDates', () => {
  it('derive les dates affichees depuis les creneaux et dedoublonne par jour', () => {
    const dates = listPublicSlotDates([
      { date: new Date('2026-05-12T00:00:00.000Z') },
      { date: new Date('2026-05-12T00:00:00.000Z') },
      { date: new Date('2026-05-13T00:00:00.000Z') },
    ])

    expect(dates).toEqual([
      { key: '2026-05-12', weekday: 'mar', day: '12', isAvailable: true },
      { key: '2026-05-13', weekday: 'mer', day: '13', isAvailable: true },
    ])
  })

  it('marque un jour indisponible si aucun de ses creneaux nest disponible', () => {
    const dates = listPublicSlotDates([
      { date: new Date('2026-05-12T00:00:00.000Z'), isAvailable: false },
      { date: new Date('2026-05-12T00:00:00.000Z'), isAvailable: false },
      { date: new Date('2026-05-13T00:00:00.000Z'), isAvailable: false },
      { date: new Date('2026-05-13T00:00:00.000Z'), isAvailable: true },
    ])

    expect(dates).toEqual([
      { key: '2026-05-12', weekday: 'mar', day: '12', isAvailable: false },
      { key: '2026-05-13', weekday: 'mer', day: '13', isAvailable: true },
    ])
  })
})
