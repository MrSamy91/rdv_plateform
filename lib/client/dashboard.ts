import { BookingStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { toClientBookingItem, toDateOnly } from './_format'
import { getClientRewardsOverview } from './rewards'

export async function getClientDashboardSummary(clientId: string) {
  const today = toDateOnly()

  const [nextBooking, completedBookingsCount, rewardsOverview] = await Promise.all([
    db.booking.findFirst({
      where: {
        clientId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        timeSlot: {
          date: { gte: today },
        },
      },
      include: {
        service: {
          select: {
            name: true,
          },
        },
        member: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        timeSlot: {
          select: {
            date: true,
            startTime: true,
          },
        },
      },
      orderBy: [{ timeSlot: { date: 'asc' } }, { timeSlot: { startTime: 'asc' } }],
    }),
    db.booking.count({
      where: {
        clientId,
        status: BookingStatus.COMPLETED,
      },
    }),
    getClientRewardsOverview(clientId),
  ])

  return {
    nextBooking: nextBooking ? toClientBookingItem(nextBooking) : null,
    completedBookingsCount,
    loyaltyPoints: rewardsOverview.loyaltyPoints,
  }
}
