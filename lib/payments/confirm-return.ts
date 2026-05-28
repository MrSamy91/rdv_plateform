// Validation cote serveur d'un retour de Checkout (page /return apres paiement).
//
// Pourquoi ce module en plus du webhook : en prod, le webhook Stripe est seul
// juge du "paye" (cf. webhook.ts). Mais en local, le `stripe listen` du CLI
// peut etre indisponible (firewall, WebSocket coupe sur Windows, etc.), et
// l'event n'arrive jamais. Ce fallback synchrone, declenche par la page de
// retour cote serveur, retrouve la session via l'API Stripe et marque le
// paiement comme reussi via le MEME `markBookingPaid` que le webhook.
//
// Idempotent et SAFE en prod : si le webhook a deja marque SUCCEEDED en premier,
// `markBookingPaid` no-op. Sinon ce fallback prend le relais. La verification
// reste ancree dans Stripe (on retrieve la session) et l'ownership est verifie
// en BDD avant tout marquage.
import type Stripe from 'stripe'
import { PaymentStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import { markBookingPaid } from './webhook'

export type ConfirmCheckoutReturnResult =
  | { ok: true; alreadyPaid: boolean }
  | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_PAID' | 'STRIPE_ERROR' }

interface ConfirmCheckoutReturnInput {
  sessionId: string
  clientId: string
}

export async function confirmCheckoutReturn({
  sessionId,
  clientId,
}: ConfirmCheckoutReturnInput): Promise<ConfirmCheckoutReturnResult> {
  // 1. Retrouver le Payment correspondant en BDD (+ ownership via booking.clientId).
  const payment = await db.payment.findUnique({
    where: { stripeSessionId: sessionId },
    select: {
      id: true,
      status: true,
      booking: { select: { clientId: true } },
    },
  })

  if (!payment) {
    return { ok: false, code: 'NOT_FOUND' }
  }

  if (payment.booking.clientId !== clientId) {
    return { ok: false, code: 'FORBIDDEN' }
  }

  // Webhook deja passe -> no-op silencieux, succes.
  if (payment.status === PaymentStatus.SUCCEEDED) {
    return { ok: true, alreadyPaid: true }
  }

  // 2. Retrieve la session cote Stripe pour verifier l'etat reel du paiement.
  //    On expand `payment_intent.latest_charge` pour recuperer le recu en une
  //    seule requete.
  let session: Stripe.Checkout.Session
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge'],
    })
  } catch {
    return { ok: false, code: 'STRIPE_ERROR' }
  }

  if (session.payment_status !== 'paid' || session.status !== 'complete') {
    return { ok: false, code: 'NOT_PAID' }
  }

  // 3. Extraire le PaymentIntent id + URL du recu (via latest_charge expanded).
  const paymentIntent = session.payment_intent
  let paymentIntentId: string | null = null
  let receiptUrl: string | null = null

  if (typeof paymentIntent === 'string') {
    paymentIntentId = paymentIntent
  } else if (paymentIntent) {
    paymentIntentId = paymentIntent.id
    const charge = paymentIntent.latest_charge
    if (charge && typeof charge !== 'string') {
      receiptUrl = charge.receipt_url ?? null
    }
  }

  if (!paymentIntentId) {
    return { ok: false, code: 'NOT_PAID' }
  }

  // 4. Marque comme paye via le MEME chemin que le webhook (idempotent).
  await markBookingPaid({ sessionId, paymentIntentId, receiptUrl })

  return { ok: true, alreadyPaid: false }
}
