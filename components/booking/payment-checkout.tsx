'use client'

import { useCallback } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { getStripeClient } from '@/lib/stripe/client'
import { trpc } from '@/lib/trpc/client'

interface PaymentCheckoutProps {
  bookingId: string
}

export function PaymentCheckout({ bookingId }: PaymentCheckoutProps) {
  // On passe par le client tRPC "vanilla" (stable entre les renders) pour eviter
  // de recreer fetchClientSecret et donc de re-initialiser l'Embedded Checkout.
  const utils = trpc.useUtils()

  const fetchClientSecret = useCallback(async () => {
    const { clientSecret } = await utils.client.payment.createCheckoutSession.mutate({ bookingId })
    return clientSecret
  }, [utils, bookingId])

  return (
    <div id="checkout" className="overflow-hidden rounded-2xl">
      <EmbeddedCheckoutProvider stripe={getStripeClient()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
