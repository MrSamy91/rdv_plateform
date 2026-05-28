// Creation d'une session Stripe Embedded Checkout pour payer un booking.
//
// Le paiement est OPTIONNEL : le booking est deja CONFIRMED a la reservation.
// Ici on cree juste une session de paiement + une ligne Payment (PENDING).
// Le montant vient TOUJOURS de la BDD (booking.totalPrice), jamais du client.
import { z } from 'zod'
import { PaymentStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { getServerAppUrl } from '@/lib/env'
import { getStripe } from '@/lib/stripe'

export const createBookingCheckoutSchema = z.object({
  bookingId: z.string().min(1),
})

export type CreateCheckoutResult =
  | { ok: true; clientSecret: string }
  | {
      ok: false
      code: 'NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_PAID'
      message: string
    }

interface CreateCheckoutInput {
  bookingId: string
  clientId: string
}

export async function createBookingCheckoutSession({
  bookingId,
  clientId,
}: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      clientId: true,
      totalPrice: true,
      service: { select: { name: true } },
      member: { select: { organization: { select: { slug: true } } } },
      payment: { select: { status: true } },
    },
  })

  if (!booking) {
    return { ok: false, code: 'NOT_FOUND', message: 'Reservation introuvable.' }
  }

  // Ownership verifie cote serveur : on ne paie que ses propres reservations.
  if (booking.clientId !== clientId) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Vous ne pouvez pas payer cette reservation.',
    }
  }

  if (booking.payment?.status === PaymentStatus.SUCCEEDED) {
    return { ok: false, code: 'ALREADY_PAID', message: 'Cette reservation est deja payee.' }
  }

  const slug = booking.member.organization.slug
  // totalPrice est un Float (euros) -> Stripe attend des centimes entiers.
  const unitAmount = Math.round(booking.totalPrice * 100)

  const session = await getStripe().checkout.sessions.create({
    // stripe v22 : la valeur "embedded" s'appelle desormais "embedded_page"
    // (le client_secret reste compatible avec @stripe/react-stripe-js EmbeddedCheckout).
    ui_mode: 'embedded_page',
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: booking.service.name },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    // metadata.bookingId : relu par le webhook pour rattacher le paiement.
    metadata: { bookingId: booking.id },
    return_url: `${getServerAppUrl()}/${slug}/booking/payment/return?session_id={CHECKOUT_SESSION_ID}`,
  })

  if (!session.client_secret) {
    return { ok: false, code: 'NOT_FOUND', message: 'Session de paiement invalide.' }
  }

  // Upsert : si le client relance un paiement (retry), on reutilise la ligne.
  await db.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: booking.totalPrice,
      currency: 'eur',
      status: PaymentStatus.PENDING,
      stripeSessionId: session.id,
    },
    update: {
      amount: booking.totalPrice,
      status: PaymentStatus.PENDING,
      stripeSessionId: session.id,
    },
  })

  return { ok: true, clientSecret: session.client_secret }
}
