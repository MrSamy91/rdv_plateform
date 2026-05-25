import { z } from 'zod'
import { BookingStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { normalizePublicOrgSlug } from '@/lib/routes/organization-public-route'

export const confirmPublicBookingSelectionSchema = z.object({
  orgSlug: z.string().min(1),
  serviceId: z.string().min(1),
  memberId: z.string().min(1),
  slotId: z.string().min(1),
  time: z.string().min(1), // Heure de début choisie
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

// Helpers pour la manipulation du temps (minutes)
const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
const toTime = (m: number) =>
  `${Math.floor(m / 60)
    .toString()
    .padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`

export async function confirmPublicBooking(
  input: z.input<typeof confirmPublicBookingSchema>,
): Promise<ConfirmPublicBookingResult> {
  const parsedInput = confirmPublicBookingSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message: 'La réservation est incomplète.',
    }
  }

  const { orgSlug, clientId, serviceId, memberId, slotId, time } = parsedInput.data

  if (!checkPublicBookingRateLimit(clientId)) {
    return {
      ok: false,
      code: 'RATE_LIMITED',
      message: 'Trop de tentatives. Réessayez dans une minute.',
    }
  }

  const slug = normalizePublicOrgSlug(orgSlug)

  try {
    return await db.$transaction(async (tx) => {
      // 1. Vérifier le service
      const service = await tx.service.findFirst({
        where: {
          id: serviceId,
          organization: { slug },
          members: {
            some: {
              memberId,
            },
          },
        },
        select: { id: true, price: true, duration: true },
      })
      if (!service) throw new Error('SLOT_UNAVAILABLE')

      // 2. Récupérer le grand créneau parent
      const parentSlot = await tx.timeSlot.findFirst({
        where: {
          id: slotId,
          memberId,
          isAvailable: true,
          member: { organization: { slug } },
        },
      })
      if (!parentSlot) throw new Error('SLOT_UNAVAILABLE')

      const bookingStartMins = toMins(time)
      const bookingEndMins = bookingStartMins + service.duration
      const parentStartMins = toMins(parentSlot.startTime)
      const parentEndMins = toMins(parentSlot.endTime)

      // Vérifier que la réservation tient bien dans le grand créneau
      if (bookingStartMins < parentStartMins || bookingEndMins > parentEndMins) {
        throw new Error('SLOT_UNAVAILABLE')
      }

      // 3. Découpage dynamique : on met à jour le slot original pour qu'il devienne le créneau réservé.
      await tx.timeSlot.update({
        where: { id: parentSlot.id },
        data: {
          startTime: time,
          endTime: toTime(bookingEndMins),
          isAvailable: false,
        },
      })

      // 4. Créer les nouveaux créneaux libres pour l'espace restant AVANT et APRÈS
      const newSlotsToCreate = []
      if (bookingStartMins > parentStartMins) {
        newSlotsToCreate.push({
          memberId,
          date: parentSlot.date,
          startTime: parentSlot.startTime,
          endTime: time,
          isAvailable: true,
        })
      }
      if (bookingEndMins < parentEndMins) {
        newSlotsToCreate.push({
          memberId,
          date: parentSlot.date,
          startTime: toTime(bookingEndMins),
          endTime: parentSlot.endTime,
          isAvailable: true,
        })
      }
      if (newSlotsToCreate.length > 0) {
        await tx.timeSlot.createMany({ data: newSlotsToCreate })
      }

      // 5. Créer la réservation attachée au créneau original (maintenant réduit et réservé)
      const booking = await tx.booking.create({
        data: {
          clientId,
          memberId,
          serviceId: service.id,
          timeSlotId: parentSlot.id,
          status: BookingStatus.CONFIRMED,
          totalPrice: service.price,
        },
        select: { id: true },
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
