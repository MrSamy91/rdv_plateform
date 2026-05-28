import { BookingStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { toClientBookingItem, toDateOnly } from './_format'

const bookingInclude = {
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
  payment: {
    select: {
      status: true,
      receiptUrl: true,
    },
  },
} as const

export async function getClientUpcomingBookings(clientId: string) {
  const today = toDateOnly()
  const bookings = await db.booking.findMany({
    where: {
      clientId,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      timeSlot: {
        date: { gte: today },
      },
    },
    include: bookingInclude,
    orderBy: [{ timeSlot: { date: 'asc' } }, { timeSlot: { startTime: 'asc' } }],
  })

  return bookings.map(toClientBookingItem)
}

export async function getClientBookingHistory(clientId: string) {
  const today = toDateOnly()
  const bookings = await db.booking.findMany({
    where: {
      clientId,
      OR: [
        { status: { in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] } },
        { timeSlot: { date: { lt: today } } },
      ],
    },
    include: bookingInclude,
    orderBy: [{ timeSlot: { date: 'desc' } }, { timeSlot: { startTime: 'desc' } }],
  })

  const items = bookings.map(toClientBookingItem)
  const completedCount = items.filter(
    (booking) => booking.status === BookingStatus.COMPLETED,
  ).length
  const cancelledCount = items.filter(
    (booking) => booking.status === BookingStatus.CANCELLED,
  ).length
  const totalSpent = items
    .filter((booking) => booking.status === BookingStatus.COMPLETED)
    .reduce((sum, booking) => sum + booking.price, 0)

  return {
    bookings: items,
    completedCount,
    cancelledCount,
    totalSpent,
  }
}
