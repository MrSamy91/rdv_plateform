import type { BookingStatus, PaymentStatus, RewardStatus } from '@/generated/prisma/enums'

export interface ClientBookingItem {
  id: string
  org: string
  service: string
  member: string
  date: string
  time: string
  price: number
  status: BookingStatus
  paidOnline: boolean
  receiptUrl: string | null
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
  // Optionnel : seules les requetes qui incluent `payment` le fournissent
  // (bookings + history). Les autres (dashboard, member) restent intactes.
  payment?: {
    status: PaymentStatus
    receiptUrl: string | null
  } | null
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
    paidOnline: booking.payment?.status === 'SUCCEEDED',
    receiptUrl: booking.payment?.receiptUrl ?? null,
  }
}

export function toDateOnly(value = new Date()) {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
}
