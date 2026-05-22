import { z } from 'zod'
import { BookingStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { normalizePublicOrgSlug } from '@/lib/routes/organization-public-route'

export const confirmPublicBookingSelectionSchema = z.object({
  orgSlug: z.string().min(1),
  serviceId: z.string().min(1),
  memberId: z.string().min(1),
  slotId: z.string().min(1),
})

const confirmPublicBookingSchema = confirmPublicBookingSelectionSchema.extend({
  clientId: z.string().min(1),
})

const bookingAttempts = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_ATTEMPTS = 3

export type ConfirmPublicBookingResult =
  | { ok: true; bookingId: string }
  | {
      ok: false
      code: 'INVALID_INPUT' | 'RATE_LIMITED' | 'SLOT_UNAVAILABLE'
      message: string
    }

export function resetPublicBookingRateLimit() {
  bookingAttempts.clear()
}

function checkPublicBookingRateLimit(clientId: string) {
  const now = Date.now()
  const recentAttempts = (bookingAttempts.get(clientId) ?? []).filter(
    (attemptAt) => now - attemptAt < RATE_LIMIT_WINDOW_MS,
  )

  if (recentAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    bookingAttempts.set(clientId, recentAttempts)
    return false
  }

  bookingAttempts.set(clientId, [...recentAttempts, now])
  return true
}

export async function confirmPublicBooking(
  input: z.input<typeof confirmPublicBookingSchema>,
): Promise<ConfirmPublicBookingResult> {
  const parsedInput = confirmPublicBookingSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message: 'La reservation est incomplete.',
    }
  }

  const { orgSlug, clientId, serviceId, memberId, slotId } = parsedInput.data

  if (!checkPublicBookingRateLimit(clientId)) {
    return {
      ok: false,
      code: 'RATE_LIMITED',
      message: 'Trop de tentatives. Reessayez dans une minute.',
    }
  }

  const slug = normalizePublicOrgSlug(orgSlug)

  try {
    return await db.$transaction(async (tx) => {
      const service = await tx.service.findFirst({
        where: {
          id: serviceId,
          organization: {
            slug,
          },
          members: {
            some: {
              memberId,
            },
          },
        },
        select: {
          id: true,
          price: true,
        },
      })

      const slotUpdate = await tx.timeSlot.updateMany({
        where: {
          id: slotId,
          memberId,
          isAvailable: true,
          member: {
            organization: {
              slug,
            },
          },
        },
        data: {
          isAvailable: false,
        },
      })

      if (!service || slotUpdate.count !== 1) {
        throw new Error('SLOT_UNAVAILABLE')
      }

      const booking = await tx.booking.create({
        data: {
          clientId,
          memberId,
          serviceId: service.id,
          timeSlotId: slotId,
          status: BookingStatus.CONFIRMED,
          totalPrice: service.price,
        },
        select: {
          id: true,
        },
      })

      return {
        ok: true,
        bookingId: booking.id,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'SLOT_UNAVAILABLE') {
      return {
        ok: false,
        code: 'SLOT_UNAVAILABLE',
        message: 'Ce creneau nest plus disponible.',
      }
    }

    throw error
  }
}
