// Traitement des webhooks Stripe — SOURCE DE VERITE du "paye".
//
// Le return_url cote client est asynchrone et non fiable : seul le webhook
// (signature deja verifiee dans la route) marque un paiement comme reussi.
// Regle security.md : pas de logique metier ici, juste marquer paye, idempotent.
import type Stripe from 'stripe'
import { PaymentStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

interface MarkBookingPaidInput {
  sessionId: string
  paymentIntentId: string
  receiptUrl: string | null
}

// Marque le Payment SUCCEEDED + reporte l'id PaymentIntent sur le Booking.
// Idempotent : un 2e appel (Stripe peut renvoyer un event) ne fait rien.
export async function markBookingPaid({
  sessionId,
  paymentIntentId,
  receiptUrl,
}: MarkBookingPaidInput) {
  const payment = await db.payment.findUnique({
    where: { stripeSessionId: sessionId },
    select: { id: true, bookingId: true, status: true },
  })

  // Session inconnue (creee hors de notre flow) ou deja traitee -> no-op.
  if (!payment || payment.status === PaymentStatus.SUCCEEDED) {
    return
  }

  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: paymentIntentId,
        receiptUrl,
        paidAt: new Date(),
      },
    }),
    db.booking.update({
      where: { id: payment.bookingId },
      data: { stripePaymentId: paymentIntentId },
    }),
  ])
}

// Dispatch d'un event Stripe deja verifie. On ne traite que la fin de paiement.
export async function handleStripeWebhookEvent(event: Stripe.Event) {
  if (event.type !== 'checkout.session.completed') {
    return
  }

  const session = event.data.object
  if (session.mode !== 'payment' || session.payment_status !== 'paid') {
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id

  if (!paymentIntentId) {
    return
  }

  // L'URL du recu est un nice-to-have : si la recuperation echoue (PI introuvable
  // sur les events de test `stripe trigger`, ou tout autre erreur reseau Stripe),
  // on marque QUAND MEME le paiement comme reussi, juste sans recu. Le marquage
  // "paye" est l'info critique ; sans ce try/catch, une 404 sur le PI ferait
  // crasher tout le webhook (return 500) et le booking ne serait jamais paye.
  let receiptUrl: string | null = null
  try {
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    })
    const charge = paymentIntent.latest_charge
    if (charge && typeof charge !== 'string') {
      receiptUrl = charge.receipt_url ?? null
    }
  } catch (error) {
    // On log mais on n'arrete pas le flow : le booking sera marque paye sans recu.
    console.warn('[stripe webhook] recu non recuperable pour PI', paymentIntentId, error)
  }

  await markBookingPaid({ sessionId: session.id, paymentIntentId, receiptUrl })
}
