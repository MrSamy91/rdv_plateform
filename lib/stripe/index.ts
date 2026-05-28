// Client Stripe SERVEUR (singleton). INTERNE au module lib/stripe.
// A importer uniquement cote serveur (tRPC, route handler webhook) — jamais client.
//
// Pourquoi lazy (getStripe) plutot qu'un export top-level comme lib/db :
// `next build` evalue le top-level des route handlers. Instancier Stripe au
// chargement du module ferait crasher le build si STRIPE_SECRET_KEY est absente
// (ex: build:check avec SKIP_ENV_VALIDATION). On differe donc l'init au 1er appel.
import Stripe from 'stripe'
import { env } from '@/lib/env'

let cached: Stripe | undefined

export function getStripe(): Stripe {
  if (cached) {
    return cached
  }

  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required to use Stripe')
  }

  cached = new Stripe(env.STRIPE_SECRET_KEY)
  return cached
}
