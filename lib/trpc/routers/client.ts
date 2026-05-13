import { router, protectedProcedure } from '../init'
import { getClientBookingHistory, getClientUpcomingBookings } from '@/lib/client/bookings'
import { getClientDashboardSummary } from '@/lib/client/dashboard'
import { getClientProfile, updateClientPhone, updateClientPhoneSchema } from '@/lib/client/profile'
import { getClientRewardsOverview } from '@/lib/client/rewards'

export const clientRouter = router({
  dashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    return await getClientDashboardSummary(ctx.user.id)
  }),

  upcomingBookings: protectedProcedure.query(async ({ ctx }) => {
    return await getClientUpcomingBookings(ctx.user.id)
  }),

  bookingHistory: protectedProcedure.query(async ({ ctx }) => {
    return await getClientBookingHistory(ctx.user.id)
  }),

  rewardsOverview: protectedProcedure.query(async ({ ctx }) => {
    return await getClientRewardsOverview(ctx.user.id)
  }),

  profile: protectedProcedure.query(async ({ ctx }) => {
    return await getClientProfile(ctx.user.id)
  }),

  updatePhone: protectedProcedure
    .input(updateClientPhoneSchema)
    .mutation(async ({ ctx, input }) => {
      return await updateClientPhone(ctx.user.id, input)
    }),
})
