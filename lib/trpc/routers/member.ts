import { TRPCError } from '@trpc/server'
import { protectedProcedure, router } from '../init'
import { getMemberAvailability } from '@/lib/member/availability'
import { getMemberCalendarBookings } from '@/lib/member/bookings'
import { getMemberDashboardSummary } from '@/lib/member/dashboard'
import {
  getMemberProfile,
  updateMemberProfile,
  updateMemberProfileSchema,
} from '@/lib/member/profile'

function ensureMemberResult<T>(result: T | null): T {
  if (!result) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Aucun profil professionnel associe a cet utilisateur.',
    })
  }

  return result
}

export const memberRouter = router({
  dashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    return ensureMemberResult(await getMemberDashboardSummary(ctx.user.id))
  }),

  calendarBookings: protectedProcedure.query(async ({ ctx }) => {
    return ensureMemberResult(await getMemberCalendarBookings(ctx.user.id))
  }),

  availability: protectedProcedure.query(async ({ ctx }) => {
    return ensureMemberResult(await getMemberAvailability(ctx.user.id))
  }),

  profile: protectedProcedure.query(async ({ ctx }) => {
    return ensureMemberResult(await getMemberProfile(ctx.user.id))
  }),

  updateProfile: protectedProcedure
    .input(updateMemberProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ensureMemberResult(await updateMemberProfile(ctx.user.id, input))
    }),
})
