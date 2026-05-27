import { describe, expect, it } from 'vitest'
import { toPublicBookingSlot } from './public-booking-slot'

describe('toPublicBookingSlot', () => {
  it('mappe un créneau brut vers la forme publique attendue', () => {
    const result = toPublicBookingSlot({
      id: 'slot-1',
      date: new Date('2026-05-12T00:00:00.000Z'),
      startTime: '10:30',
      endTime: '11:30',
      isAvailable: true,
      member: { user: { name: 'Mila Laurent' } },
    })

    expect(result).toEqual({
      id: 'slot-1',
      dateKey: '2026-05-12',
      startTime: '10:30',
      endTime: '11:30',
      isAvailable: true,
      memberName: 'Mila Laurent',
    })
  })

  it('dérive dateKey en YYYY-MM-DD et conserve indisponibilité + nom du pro', () => {
    const result = toPublicBookingSlot({
      id: 'slot-2',
      date: new Date('2026-12-01T23:59:59.000Z'),
      startTime: '09:00',
      endTime: '09:45',
      isAvailable: false,
      member: { user: { name: 'Leo Martin' } },
    })

    expect(result.dateKey).toBe('2026-12-01')
    expect(result.isAvailable).toBe(false)
    expect(result.memberName).toBe('Leo Martin')
  })
})
