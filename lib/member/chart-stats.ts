import { db } from '@/lib/db'

// Données pour le graphique member : réservations par jour (passé + futur)
export async function getMemberBookingsPerDay(memberId: string, pastDays = 30, futureDays = 30) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const since = new Date(today)
  since.setDate(since.getDate() - pastDays)

  const until = new Date(today)
  until.setDate(until.getDate() + futureDays)
  until.setHours(23, 59, 59, 999)

  const bookings = await db.booking.findMany({
    where: {
      memberId,
      timeSlot: { date: { gte: since, lte: until } },
    },
    select: {
      timeSlot: { select: { date: true } },
    },
  })

  // Grouper par jour
  const countsByDay = new Map<string, number>()
  for (const b of bookings) {
    if (!b.timeSlot) continue
    const key = b.timeSlot.date.toISOString().slice(0, 10)
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1)
  }

  // Générer tous les jours avec 0 pour les jours sans RDV
  const result: { date: string; bookings: number; isFuture: boolean }[] = []
  const cursor = new Date(since)

  while (cursor <= until) {
    const key = cursor.toISOString().slice(0, 10)
    result.push({
      date: key,
      bookings: countsByDay.get(key) ?? 0,
      isFuture: cursor > today,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}
