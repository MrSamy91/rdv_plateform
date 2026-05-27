// Mapping pur : créneau brut (Prisma) -> forme publique consommée par l'UI de réservation.
// Isolé dans son propre fichier (sans import de `db`) pour rester testable en unit, sans BDD.

interface RawBookingSlot {
  id: string
  date: Date
  startTime: string
  endTime: string
  isAvailable: boolean
  member: { user: { name: string } }
}

export interface PublicBookingSlot {
  id: string
  dateKey: string
  startTime: string
  endTime: string
  isAvailable: boolean
  memberName: string
}

// `dateKey` au format "YYYY-MM-DD" : clé de regroupement par jour côté UI,
// identique à celle dérivée par listPublicSlotDates (cohérence date <-> créneaux).
export function toPublicBookingSlot(slot: RawBookingSlot): PublicBookingSlot {
  return {
    id: slot.id,
    dateKey: slot.date.toISOString().slice(0, 10),
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.isAvailable,
    memberName: slot.member.user.name,
  }
}
