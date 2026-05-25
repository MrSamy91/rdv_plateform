// Router tRPC pour les creneaux de disponibilite.
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../init'

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format attendu : HH:mm')

const timeSlotBaseSchema = z.object({
  memberId: z.string().min(1),
  date: z.coerce.date(),
  startTime: timeSchema,
  endTime: timeSchema,
  isAvailable: z.boolean().optional(),
})

const timeSlotInputSchema = timeSlotBaseSchema.refine(
  ({ startTime, endTime }) => startTime < endTime,
  {
    message: "L'heure de fin doit etre apres l'heure de debut.",
    path: ['endTime'],
  },
)

const updateTimeSlotSchema = timeSlotBaseSchema
  .omit({ memberId: true })
  .partial()
  .extend({
    timeSlotId: z.string().min(1),
  })
  .refine(
    ({ date, startTime, endTime, isAvailable }) =>
      date !== undefined ||
      startTime !== undefined ||
      endTime !== undefined ||
      isAvailable !== undefined,
    'Au moins un champ doit etre renseigne.',
  )

function toDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

async function getMemberForAccess(
  ctx: { db: typeof import('@/lib/db').db; user: { id: string } },
  memberId: string,
) {
  const member = await ctx.db.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      userId: true,
      organization: {
        select: {
          ownerId: true,
        },
      },
    },
  })

  if (!member) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Professionnel introuvable.' })
  }

  if (member.userId !== ctx.user.id && member.organization.ownerId !== ctx.user.id) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Vous ne pouvez pas gerer les creneaux de ce professionnel.',
    })
  }

  return member
}

async function getTimeSlotForAccess(
  ctx: { db: typeof import('@/lib/db').db; user: { id: string } },
  timeSlotId: string,
) {
  const timeSlot = await ctx.db.timeSlot.findUnique({
    where: { id: timeSlotId },
    include: {
      booking: {
        select: { id: true },
      },
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

  if (!timeSlot) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Creneau introuvable.' })
  }

  if (
    timeSlot.member.userId !== ctx.user.id &&
    timeSlot.member.organization.ownerId !== ctx.user.id
  ) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Vous ne pouvez pas gerer ce creneau.',
    })
  }

  return timeSlot
}

async function ensureNoSlotAtSameStart(
  ctx: { db: typeof import('@/lib/db').db },
  input: { memberId: string; date: Date; startTime: string; excludeTimeSlotId?: string },
) {
  const existingSlot = await ctx.db.timeSlot.findFirst({
    where: {
      memberId: input.memberId,
      date: toDateOnly(input.date),
      startTime: input.startTime,
      ...(input.excludeTimeSlotId ? { id: { not: input.excludeTimeSlotId } } : {}),
    },
    select: { id: true },
  })

  if (existingSlot) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'Un creneau existe deja a cette heure.',
    })
  }
}

export const timeSlotRouter = router({
  listByMember: protectedProcedure
    .input(z.object({ memberId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await getMemberForAccess(ctx, input.memberId)

      return await ctx.db.timeSlot.findMany({
        where: { memberId: input.memberId },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      })
    }),

  checkAvailability: protectedProcedure
    .input(z.object({ timeSlotId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const timeSlot = await ctx.db.timeSlot.findUnique({
        where: { id: input.timeSlotId },
        select: {
          id: true,
          isAvailable: true,
          booking: {
            select: { id: true },
          },
        },
      })

      if (!timeSlot) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Creneau introuvable.' })
      }

      return {
        timeSlotId: timeSlot.id,
        isAvailable: timeSlot.isAvailable && !timeSlot.booking,
      }
    }),

  create: protectedProcedure.input(timeSlotInputSchema).mutation(async ({ ctx, input }) => {
    await getMemberForAccess(ctx, input.memberId)
    await ensureNoSlotAtSameStart(ctx, input)

    return await ctx.db.timeSlot.create({
      data: {
        memberId: input.memberId,
        date: toDateOnly(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
        isAvailable: input.isAvailable ?? true,
      },
    })
  }),

  update: protectedProcedure.input(updateTimeSlotSchema).mutation(async ({ ctx, input }) => {
    const timeSlot = await getTimeSlotForAccess(ctx, input.timeSlotId)

    if (timeSlot.booking) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Impossible de modifier un creneau lie a une reservation.',
      })
    }

    const nextDate = input.date ? toDateOnly(input.date) : timeSlot.date
    const nextStartTime = input.startTime ?? timeSlot.startTime
    const nextEndTime = input.endTime ?? timeSlot.endTime

    if (nextStartTime >= nextEndTime) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "L'heure de fin doit etre apres l'heure de debut.",
      })
    }

    if (input.date || input.startTime) {
      await ensureNoSlotAtSameStart(ctx, {
        memberId: timeSlot.memberId,
        date: nextDate,
        startTime: nextStartTime,
        excludeTimeSlotId: timeSlot.id,
      })
    }

    return await ctx.db.timeSlot.update({
      where: { id: timeSlot.id },
      data: {
        date: input.date ? nextDate : undefined,
        startTime: input.startTime,
        endTime: input.endTime,
        isAvailable: input.isAvailable,
      },
    })
  }),

  delete: protectedProcedure
    .input(z.object({ timeSlotId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const timeSlot = await getTimeSlotForAccess(ctx, input.timeSlotId)

      if (timeSlot.booking) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Impossible de supprimer un creneau lie a une reservation.',
        })
      }

      await ctx.db.timeSlot.delete({ where: { id: timeSlot.id } })

      return { timeSlotId: timeSlot.id }
    }),
})
