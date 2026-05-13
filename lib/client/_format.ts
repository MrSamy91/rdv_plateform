import type { BookingStatus, RewardStatus } from '@/generated/prisma/enums'

export interface ClientBookingItem {
  id: string
  org: string
  service: string
  member: string
  date: string
  time: string
  price: number
  status: BookingStatus
}

export interface ClientRewardItem {
  id: string
  type: string
  status: RewardStatus
  expirationDate: string
}

type BookingWithDetails = {
  id: string
  status: BookingStatus
  totalPrice: number
  service: {
    name: string
  }
  member: {
    user: {
      name: string
    }
    organization: {
      name: string
    }
  }
  timeSlot: {
    date: Date
    startTime: string
  }
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

export function toClientBookingItem(booking: BookingWithDetails): ClientBookingItem {
  return {
    id: booking.id,
    org: booking.member.organization.name,
    service: booking.service.name,
    member: booking.member.user.name,
    date: dateFormatter.format(booking.timeSlot.date),
    time: booking.timeSlot.startTime,
    price: booking.totalPrice,
    status: booking.status,
  }
}

export function toDateOnly(value = new Date()) {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
}
