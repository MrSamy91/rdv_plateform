// Lecture d'un booking en vue de son paiement (page paiement, shell serveur).
// Verifie l'ownership : retourne null si le booking n'existe pas ou n'appartient
// pas au client connecte -> la page repond notFound().
import { db } from '@/lib/db'

export async function getBookingForPayment(bookingId: string, clientId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      clientId: true,
      totalPrice: true,
      service: { select: { name: true, duration: true } },
      member: {
        select: {
          user: { select: { name: true } },
          organization: { select: { name: true, slug: true } },
        },
      },
      timeSlot: { select: { date: true, startTime: true } },
      payment: { select: { status: true } },
    },
  })

  if (!booking || booking.clientId !== clientId) {
    return null
  }

  return booking
}
