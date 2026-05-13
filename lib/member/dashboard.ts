import { BookingStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import {
  getCurrentMonthRange,
  getCurrentWeekRange,
  toDateOnly,
  toMemberBookingItem,
} from './_format'
import { getMemberProfile } from './profile'

export async function getMemberDashboardSummary(userId: string) {
  const profile = await getMemberProfile(userId)

  if (!profile) {
    return null
  }

  const today = toDateOnly()
  const tomorrow = toDateOnly(
    new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1),
  )
  const week = getCurrentWeekRange()
  const month = getCurrentMonthRange()

  const [todayBookingsCount, weekBookingsCount, monthClients, nextBookings, reviewsStats] =
    await Promise.all([
      db.booking.count({
        where: {
          memberId: profile.id,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          timeSlot: { date: { gte: today, lt: tomorrow } },
        },
      }),
      db.booking.count({
        where: {
          memberId: profile.id,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          timeSlot: { date: { gte: week.start, lt: week.end } },
        },
      }),
      db.booking.findMany({
        where: {
          memberId: profile.id,
          timeSlot: { date: { gte: month.start, lt: month.end } },
        },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
      db.booking.findMany({
        where: {
          memberId: profile.id,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          timeSlot: { date: { gte: today } },
        },
        include: {
          client: { select: { name: true } },
          service: { select: { name: true } },
          timeSlot: { select: { date: true, startTime: true } },
        },
        orderBy: [{ timeSlot: { date: 'asc' } }, { timeSlot: { startTime: 'asc' } }],
        take: 5,
      }),
      db.review.aggregate({
        where: { memberId: profile.id },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ])

  return {
    profile,
    todayBookingsCount,
    weekBookingsCount,
    monthClientsCount: monthClients.length,
    averageRating: reviewsStats._avg.rating,
    reviewsCount: reviewsStats._count.id,
    nextBookings: nextBookings.map(toMemberBookingItem),
  }
}
