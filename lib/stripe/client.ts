'use client'

// Stripe.js cote NAVIGATEUR (singleton). Module client du pattern lib/stripe.
//
// `loadStripe` doit etre appele hors du render d'un composant pour ne pas
// recreer l'objet Stripe a chaque rendu. On memoise donc la promesse une fois.
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { env } from '@/lib/env'

let stripePromise: Promise<Stripe | null> | undefined

export function getStripeClient() {
  if (!stripePromise) {
    stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')
  }

  return stripePromise
}
