// Webhook Stripe — endpoint public mais VERIFIE par signature.
// Source de verite du "paye" (cf. lib/payments/webhook.ts).
//
// App Router : le body brut est lu via `request.text()` (constructEvent exige
// le payload non parse pour valider la signature). Pas de bodyParser a desactiver.
import { env } from '@/lib/env'
import { handleStripeWebhookEvent } from '@/lib/payments/webhook'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    // Signature invalide -> on rejette sans toucher la BDD.
    return new Response('Invalid signature', { status: 400 })
  }

  await handleStripeWebhookEvent(event)

  return Response.json({ received: true })
}
