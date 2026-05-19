// Fonctions serveur pour les statistiques admin.
// Utilisé directement dans les server components (pas de tRPC nécessaire).

import { db } from '@/lib/db'

// ── Période helpers ────────────────────────────────────────────────────────────

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function startOfLastMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1)
}

function endOfLastMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999)
}

// ── Stats pour les cartes ──────────────────────────────────────────────────────

export async function getAdminStats() {
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)
  const lastMonthStart = startOfLastMonth(now)
  const lastMonthEnd = endOfLastMonth(now)

  // Statuts qui correspondent à un RDV «réalisé» (ou confirmé mais passé)
  const doneStatuses = ['CONFIRMED', 'COMPLETED'] as const

  const [
    totalUsers,
    usersThisMonth,
    usersLastMonth,
    totalOrgs,
    bookingsThisMonth,
    bookingsLastMonth,
    revenueThisMonth,
    revenueLastMonth,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
    db.user.count({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),
    db.organization.count(),
    // Réservations dont le RDV tombe ce mois-ci (date du créneau)
    db.booking.count({
      where: {
        timeSlot: { date: { gte: thisMonthStart, lte: thisMonthEnd } },
        status: { in: [...doneStatuses] },
      },
    }),
    db.booking.count({
      where: {
        timeSlot: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
        status: { in: [...doneStatuses] },
      },
    }),
    // Revenus : RDV passés (timeSlot.date <= now) ce mois-ci
    db.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        status: { in: [...doneStatuses] },
        timeSlot: { date: { gte: thisMonthStart, lte: now } },
      },
    }),
    db.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        status: { in: [...doneStatuses] },
        timeSlot: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
      },
    }),
  ])

  function trend(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return {
    totalUsers,
    usersThisMonth,
    usersTrend: trend(usersThisMonth, usersLastMonth),
    totalOrgs,
    bookingsThisMonth,
    bookingsTrend: trend(bookingsThisMonth, bookingsLastMonth),
    revenueThisMonth: revenueThisMonth._sum.totalPrice ?? 0,
    revenueTrend: trend(
      revenueThisMonth._sum.totalPrice ?? 0,
      revenueLastMonth._sum.totalPrice ?? 0,
    ),
  }
}

// ── Données pour le graphique (réservations par date de RDV) ──────────────────
// pastDays : jours passés à inclure (depuis today - pastDays)
// futureDays : jours futurs à inclure (jusqu'à today + futureDays)

export async function getBookingsPerDay(pastDays = 90, futureDays = 90) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const since = new Date(today)
  since.setDate(since.getDate() - pastDays)

  const until = new Date(today)
  until.setDate(until.getDate() + futureDays)
  until.setHours(23, 59, 59, 999)

  // On joint sur timeSlot pour avoir la vraie date du rendez-vous
  const bookings = await db.booking.findMany({
    where: {
      timeSlot: {
        date: { gte: since, lte: until },
      },
    },
    select: {
      timeSlot: { select: { date: true } },
    },
  })

  // Grouper par jour (date du RDV, pas de création)
  const countsByDay = new Map<string, number>()
  for (const b of bookings) {
    if (!b.timeSlot) continue
    const key = b.timeSlot.date.toISOString().slice(0, 10)
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1)
  }

  // Générer tous les jours de la plage (avec 0 pour les jours sans RDV)
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
