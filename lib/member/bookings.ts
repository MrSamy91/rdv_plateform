import { BookingStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { toDateOnly, toMemberBookingItem } from './_format'
import { getMemberProfile } from './profile'

const bookingInclude = {
  client: {
    select: {
      name: true,
    },
  },
  service: {
    select: {
      name: true,
    },
  },
  timeSlot: {
    select: {
      date: true,
      startTime: true,
    },
  },
} as const

export async function getMemberCalendarBookings(userId: string) {
  const profile = await getMemberProfile(userId)

  if (!profile) {
    return null
  }

  const today = toDateOnly()
  const bookings = await db.booking.findMany({
    where: {
      memberId: profile.id,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      timeSlot: { date: { gte: today } },
    },
    include: bookingInclude,
    orderBy: [{ timeSlot: { date: 'asc' } }, { timeSlot: { startTime: 'asc' } }],
  })

  return bookings.map(toMemberBookingItem)
}
