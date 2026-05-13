import { db } from '@/lib/db'
import { toDateOnly, toMemberSlotItem } from './_format'
import { getMemberProfile } from './profile'

export async function getMemberAvailability(userId: string) {
  const profile = await getMemberProfile(userId)

  if (!profile) {
    return null
  }

  const slots = await db.timeSlot.findMany({
    where: {
      memberId: profile.id,
      date: { gte: toDateOnly() },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  const items = slots.map(toMemberSlotItem)

  return {
    slots: items,
    availableCount: items.filter((slot) => slot.isAvailable).length,
    bookedCount: items.filter((slot) => !slot.isAvailable).length,
  }
}
