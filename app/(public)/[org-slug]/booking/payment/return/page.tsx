import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { confirmCheckoutReturn } from '@/lib/payments/confirm-return'

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

// Page de retour apres l'Embedded Checkout (return_url).
//
// En prod : le webhook Stripe fait foi et marque deja le paiement comme reussi
// AVANT que cette page ne soit atteinte. Notre appel a `confirmCheckoutReturn`
// est alors un no-op (Payment deja SUCCEEDED).
//
// En dev sans `stripe listen` operationnel : ce fallback synchrone prend le
// relais (retrieve la session via API + marque paye via le meme code que le
// webhook). Idempotent : aucune race possible meme si webhook + retour fusent
// en parallele.
//
// Les erreurs sont silencieuses cote UX : on redirige toujours vers /bookings.
// Le badge "Paye en ligne" apparait si le paiement a ete confirme (peu importe
// quel chemin a marque la BDD).
export default async function PublicBookingPaymentReturnPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams
  const session = await getSession()

  if (sessionId && session) {
    // Best-effort : on tente la confirmation cote serveur. En cas d'echec
    // (Stripe down, session inconnue, etc.) on swallow et on redirige quand meme.
    await confirmCheckoutReturn({ sessionId, clientId: session.user.id }).catch(() => null)
  }

  redirect('/client/bookings')
}
