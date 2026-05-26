import { z } from 'zod'
import { db } from '@/lib/db'
import { getMemberProfile } from './profile'
import { TRPCError } from '@trpc/server'

export const addAvailabilitySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  startTime: z.string(), // HH:mm
  endTime: z.string(), // HH:mm
})

export const removeAvailabilitySchema = z.object({
  slotId: z.string(),
})

export async function getMemberCalendarEvents(userId: string) {
  const profile = await getMemberProfile(userId)
  if (!profile) return null

  // On récupère tous les TimeSlots du membre (libres et réservés)
  const slots = await db.timeSlot.findMany({
    where: { memberId: profile.id },
    include: {
      booking: {
        include: {
          client: true,
          service: true,
        },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  return slots.map((slot) => {
    const dateStr = slot.date.toISOString().split('T')[0] // 'YYYY-MM-DD'

    return {
      id: slot.id,
      start: `${dateStr}T${slot.startTime}:00`,
      end: `${dateStr}T${slot.endTime}:00`,
      isAvailable: slot.isAvailable,
      booking: slot.booking
        ? {
            id: slot.booking.id,
            status: slot.booking.status,
            clientName: slot.booking.client.name,
            serviceName: slot.booking.service.name,
          }
        : null,
    }
  })
}

export async function addMemberAvailability(
  userId: string,
  input: z.infer<typeof addAvailabilitySchema>,
) {
  const profile = await getMemberProfile(userId)
  if (!profile) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Profil introuvable.' })
  }

  // Vérifier les chevauchements
  const parsedDate = new Date(`${input.date}T00:00:00Z`)

  const overlapping = await db.timeSlot.findFirst({
    where: {
      memberId: profile.id,
      date: parsedDate,
      OR: [
        {
          startTime: { lt: input.endTime },
          endTime: { gt: input.startTime },
        },
      ],
    },
  })

  if (overlapping) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'Un créneau existe déjà sur cette plage horaire.',
    })
  }

  const newSlot = await db.timeSlot.create({
    data: {
      memberId: profile.id,
      date: parsedDate,
      startTime: input.startTime,
      endTime: input.endTime,
      isAvailable: true,
    },
  })

  return { ok: true, slotId: newSlot.id }
}

export async function removeMemberAvailability(
  userId: string,
  input: z.infer<typeof removeAvailabilitySchema>,
) {
  const profile = await getMemberProfile(userId)
  if (!profile) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Profil introuvable.' })
  }

  const slot = await db.timeSlot.findUnique({
    where: { id: input.slotId },
    include: { booking: true },
  })

  if (!slot || slot.memberId !== profile.id) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Créneau introuvable.' })
  }

  if (slot.booking || !slot.isAvailable) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Impossible de supprimer un créneau réservé.',
    })
  }

  await db.timeSlot.delete({
    where: { id: slot.id },
  })

  return { ok: true }
}

export const bulkActionSchema = z.object({
  date: z.string(), // YYYY-MM-DD
})

async function duplicateToMultipleDates(
  profileId: string,
  sourceDateObj: Date,
  targetDates: Date[],
) {
  // Exclure la date source des dates cibles
  const filteredTargets = targetDates.filter((d) => d.getTime() !== sourceDateObj.getTime())
  if (filteredTargets.length === 0) return

  // 1. Récupérer les créneaux sources
  const sourceSlots = await db.timeSlot.findMany({
    where: { memberId: profileId, date: sourceDateObj, isAvailable: true },
  })
  if (sourceSlots.length === 0) return

  // 2. Supprimer les créneaux libres existants sur toutes les dates cibles en UNE requête
  await db.timeSlot.deleteMany({
    where: {
      memberId: profileId,
      date: { in: filteredTargets },
      isAvailable: true,
    },
  })

  // 3. Récupérer les réservations existantes sur toutes les dates cibles en UNE requête
  const targetBookings = await db.timeSlot.findMany({
    where: {
      memberId: profileId,
      date: { in: filteredTargets },
      isAvailable: false,
    },
  })

  // 4. Calculer les nouveaux créneaux (en mémoire)
  const newSlotsData = []
  for (const targetDate of filteredTargets) {
    const dayBookings = targetBookings.filter((tb) => tb.date.getTime() === targetDate.getTime())

    for (const slot of sourceSlots) {
      const overlaps = dayBookings.some((tb) => {
        return slot.startTime < tb.endTime && slot.endTime > tb.startTime
      })

      if (!overlaps) {
        newSlotsData.push({
          memberId: profileId,
          date: targetDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: true,
        })
      }
    }
  }

  // 5. Insérer en masse en UNE requête
  if (newSlotsData.length > 0) {
    await db.timeSlot.createMany({ data: newSlotsData })
  }
}

export async function clearDayAvailabilities(
  userId: string,
  input: z.infer<typeof bulkActionSchema>,
) {
  const profile = await getMemberProfile(userId)
  if (!profile) throw new TRPCError({ code: 'FORBIDDEN', message: 'Profil introuvable.' })

  const targetDateObj = new Date(`${input.date}T00:00:00Z`)

  await db.timeSlot.deleteMany({
    where: {
      memberId: profile.id,
      date: targetDateObj,
      isAvailable: true,
    },
  })

  return { ok: true }
}

export async function applyDayToWeek(userId: string, input: z.infer<typeof bulkActionSchema>) {
  const profile = await getMemberProfile(userId)
  if (!profile) throw new TRPCError({ code: 'FORBIDDEN', message: 'Profil introuvable.' })

  const sourceDateObj = new Date(`${input.date}T00:00:00Z`)

  const dayOfWeek = sourceDateObj.getUTCDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(sourceDateObj)
  monday.setUTCDate(sourceDateObj.getUTCDate() + diffToMonday)

  const targets = []
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(monday)
    targetDate.setUTCDate(monday.getUTCDate() + i)
    targets.push(targetDate)
  }

  await duplicateToMultipleDates(profile.id, sourceDateObj, targets)
  return { ok: true }
}

export async function applyDayToDayOfWeek(userId: string, input: z.infer<typeof bulkActionSchema>) {
  const profile = await getMemberProfile(userId)
  if (!profile) throw new TRPCError({ code: 'FORBIDDEN', message: 'Profil introuvable.' })

  const sourceDateObj = new Date(`${input.date}T00:00:00Z`)

  const targets = []
  for (let i = 1; i <= 4; i++) {
    const targetDate = new Date(sourceDateObj)
    targetDate.setUTCDate(sourceDateObj.getUTCDate() + i * 7)
    targets.push(targetDate)
  }

  await duplicateToMultipleDates(profile.id, sourceDateObj, targets)
  return { ok: true }
}

export async function applyDayToMonth(userId: string, input: z.infer<typeof bulkActionSchema>) {
  const profile = await getMemberProfile(userId)
  if (!profile) throw new TRPCError({ code: 'FORBIDDEN', message: 'Profil introuvable.' })

  const sourceDateObj = new Date(`${input.date}T00:00:00Z`)

  const targets = []
  for (let i = 1; i <= 30; i++) {
    const targetDate = new Date(sourceDateObj)
    targetDate.setUTCDate(sourceDateObj.getUTCDate() + i)
    targets.push(targetDate)
  }

  await duplicateToMultipleDates(profile.id, sourceDateObj, targets)
  return { ok: true }
}
