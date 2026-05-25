// Router tRPC pour les reservations.
import { TRPCError } from '@trpc/server'
import {
  confirmPublicBooking,
  confirmPublicBookingSelectionSchema,
} from '@/lib/bookings/public-booking'
import { BookingStatus } from '@/generated/prisma/enums'
import { protectedProcedure, router } from '../init'
import { z } from 'zod'

const confirmBookingProcedure = protectedProcedure
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
  })

export const bookingRouter = router({
  confirm: confirmBookingProcedure,

  // Alias temporaire pour garder le flow public actuel fonctionnel pendant la migration UI.
  confirmPublic: confirmBookingProcedure,

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          member: {
            select: {
              userId: true,
              organization: {
                select: {
                  ownerId: true,
                },
              },
            },
          },
        },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation introuvable.' })
      }

      const canCancel =
        booking.clientId === ctx.user.id ||
        booking.member.userId === ctx.user.id ||
        booking.member.organization.ownerId === ctx.user.id

      if (!canCancel) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous ne pouvez pas annuler cette reservation.',
        })
      }

      if (booking.status === BookingStatus.COMPLETED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Une reservation terminee ne peut pas etre annulee.',
        })
      }

      if (booking.status === BookingStatus.CANCELLED) {
        return { bookingId: booking.id, status: booking.status }
      }

      const cancelledBooking = await ctx.db.$transaction(async (tx) => {
        const updatedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.CANCELLED },
          select: {
            id: true,
            status: true,
          },
        })

        await tx.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { isAvailable: true },
        })

        return updatedBooking
      })

      return {
        bookingId: cancelledBooking.id,
        status: cancelledBooking.status,
      }
    }),
})
