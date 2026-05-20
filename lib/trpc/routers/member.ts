import { TRPCError } from '@trpc/server'
import { protectedProcedure, router } from '../init'
import { getMemberAvailability } from '@/lib/member/availability'
import { getMemberCalendarBookings } from '@/lib/member/bookings'
import {
  getMemberCalendarEvents,
  addMemberAvailability,
  removeMemberAvailability,
  clearDayAvailabilities,
  applyDayToWeek,
  applyDayToDayOfWeek,
  applyDayToMonth,
  addAvailabilitySchema,
  removeAvailabilitySchema,
  bulkActionSchema,
} from '@/lib/member/calendar'
import { getMemberDashboardSummary } from '@/lib/member/dashboard'
import {
  getMemberProfile,
  updateMemberProfile,
  updateMemberProfileSchema,
} from '@/lib/member/profile'
import {
  getMemberServices,
  createMemberService,
  deleteMemberService,
  createServiceSchema,
  deleteServiceSchema,
} from '@/lib/member/services'

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

  calendarEvents: protectedProcedure.query(async ({ ctx }) => {
    return ensureMemberResult(await getMemberCalendarEvents(ctx.user.id))
  }),

  addAvailability: protectedProcedure
    .input(addAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      return ensureMemberResult(await addMemberAvailability(ctx.user.id, input))
    }),

  removeAvailability: protectedProcedure
    .input(removeAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      return ensureMemberResult(await removeMemberAvailability(ctx.user.id, input))
    }),

  updateProfile: protectedProcedure
    .input(updateMemberProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ensureMemberResult(await updateMemberProfile(ctx.user.id, input))
    }),

  clearDayAvailabilities: protectedProcedure
    .input(bulkActionSchema)
    .mutation(async ({ ctx, input }) => {
      return ensureMemberResult(await clearDayAvailabilities(ctx.user.id, input))
    }),

  applyDayToWeek: protectedProcedure.input(bulkActionSchema).mutation(async ({ ctx, input }) => {
    return ensureMemberResult(await applyDayToWeek(ctx.user.id, input))
  }),

  applyDayToDayOfWeek: protectedProcedure
    .input(bulkActionSchema)
    .mutation(async ({ ctx, input }) => {
      return ensureMemberResult(await applyDayToDayOfWeek(ctx.user.id, input))
    }),

  applyDayToMonth: protectedProcedure.input(bulkActionSchema).mutation(async ({ ctx, input }) => {
    return ensureMemberResult(await applyDayToMonth(ctx.user.id, input))
  }),

  services: protectedProcedure.query(async ({ ctx }) => {
    return ensureMemberResult(await getMemberServices(ctx.user.id))
  }),

  createService: protectedProcedure.input(createServiceSchema).mutation(async ({ ctx, input }) => {
    return ensureMemberResult(await createMemberService(ctx.user.id, input))
  }),

  deleteService: protectedProcedure.input(deleteServiceSchema).mutation(async ({ ctx, input }) => {
    return ensureMemberResult(await deleteMemberService(ctx.user.id, input.serviceId))
  }),
})
