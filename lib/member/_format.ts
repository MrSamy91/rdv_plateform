import type { BookingStatus } from '@/generated/prisma/enums'

export interface MemberBookingItem {
  id: string
  client: string
  service: string
  date: string
  time: string
  price: number
  status: BookingStatus
  notes: string | null
}

export interface MemberSlotItem {
  id: string
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

type BookingWithDetails = {
  id: string
  status: BookingStatus
  totalPrice: number
  notes: string | null
  client: {
    name: string
  }
  service: {
    name: string
  }
  timeSlot: {
    date: Date
    startTime: string
  }
}

type SlotWithDate = {
  id: string
  date: Date
  startTime: string
  endTime: string
  isAvailable: boolean
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

export function toMemberBookingItem(booking: BookingWithDetails): MemberBookingItem {
  return {
    id: booking.id,
    client: booking.client.name,
    service: booking.service.name,
    date: dateFormatter.format(booking.timeSlot.date),
    time: booking.timeSlot.startTime,
    price: booking.totalPrice,
    status: booking.status,
    notes: booking.notes,
  }
}

export function toMemberSlotItem(slot: SlotWithDate): MemberSlotItem {
  return {
    id: slot.id,
    date: dateFormatter.format(slot.date),
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.isAvailable,
  }
}

export function toDateOnly(value = new Date()) {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
}

export function getCurrentWeekRange(value = new Date()) {
  const day = value.getDay() || 7
  const start = toDateOnly(
    new Date(value.getFullYear(), value.getMonth(), value.getDate() - day + 1),
  )
  const end = toDateOnly(
    new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 7),
  )

  return { start, end }
}

export function getCurrentMonthRange(value = new Date()) {
  const start = toDateOnly(new Date(value.getFullYear(), value.getMonth(), 1))
  const end = toDateOnly(new Date(value.getFullYear(), value.getMonth() + 1, 1))

  return { start, end }
}
