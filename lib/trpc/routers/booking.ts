// Router tRPC pour les reservations.
import { TRPCError } from '@trpc/server'
import {
  confirmPublicBooking,
  confirmPublicBookingSelectionSchema,
} from '@/lib/bookings/public-booking'
import { protectedProcedure, router } from '../init'

export const bookingRouter = router({
  confirmPublic: protectedProcedure
    .input(confirmPublicBookingSelectionSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await confirmPublicBooking({
        ...input,
        clientId: ctx.user.id,
      })

      if (result.ok) {
        return { bookingId: result.bookingId }
      }

      if (result.code === 'RATE_LIMITED') {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: result.message })
      }

      if (result.code === 'SLOT_UNAVAILABLE') {
        throw new TRPCError({ code: 'CONFLICT', message: result.message })
      }

      throw new TRPCError({ code: 'BAD_REQUEST', message: result.message })
    }),
})
