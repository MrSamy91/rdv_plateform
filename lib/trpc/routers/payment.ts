// Router tRPC pour les paiements Stripe.
import { TRPCError } from '@trpc/server'
import { createBookingCheckoutSchema, createBookingCheckoutSession } from '@/lib/payments/checkout'
import { protectedProcedure, router } from '../init'

export const paymentRouter = router({
  // Cree une session Embedded Checkout pour le booking et renvoie le clientSecret.
  // protectedProcedure : il faut etre connecte, et l'ownership est verifie en BDD.
  createCheckoutSession: protectedProcedure
    .input(createBookingCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await createBookingCheckoutSession({
        bookingId: input.bookingId,
        clientId: ctx.user.id,
      })

      if (result.ok) {
        return { clientSecret: result.clientSecret }
      }

      if (result.code === 'NOT_FOUND') {
        throw new TRPCError({ code: 'NOT_FOUND', message: result.message })
      }

      if (result.code === 'FORBIDDEN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: result.message })
      }

      // ALREADY_PAID
      throw new TRPCError({ code: 'BAD_REQUEST', message: result.message })
    }),
})
