// Router tRPC pour les invitations membres (recrutement + acceptation).
import { TRPCError } from '@trpc/server'
import { InvitationStatus, Role } from '@/generated/prisma/enums'
import {
  invitationIdSchema,
  invitationTokenSchema,
  recruitEmailSchema,
} from '@/lib/invitations/schema'
import { getInvitationExpiry, getInvitationState } from '@/lib/invitations/state'
import { sendMemberInvitationEmail } from '@/lib/invitations/email'
import { protectedProcedure, router } from '../init'
import { getOwnedOrg } from '../owner'

export const invitationRouter = router({
  // Recrutement (owner) : invite un client de la plateforme a rejoindre l'orga.
  create: protectedProcedure.input(recruitEmailSchema).mutation(async ({ ctx, input }) => {
    const org = await getOwnedOrg(ctx)
    const email = input.email.toLowerCase().trim()

    // Le recrute doit etre un client INSCRIT (sinon on n'envoie rien).
    const target = await ctx.db.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    })

    if (!target) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Aucun client de la plateforme avec cet email.',
      })
    }

    if (target.role !== Role.CLIENT) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seul un client peut etre recrute.' })
    }

    if (target.id === ctx.user.id) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vous ne pouvez pas vous inviter.' })
    }

    // 1 user = 1 orga : refus si deja membre quelque part.
    const existingMember = await ctx.db.member.findUnique({
      where: { userId: target.id },
      select: { id: true },
    })

    if (existingMember) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Ce client est deja membre d’une organisation.',
      })
    }

    // Une seule invitation PENDING non-expiree par (orga, email).
    const pending = await ctx.db.memberInvitation.findFirst({
      where: {
        orgId: org.id,
        email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    })

    if (pending) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Une invitation est deja en attente.' })
    }

    const invitation = await ctx.db.memberInvitation.create({
      data: {
        email,
        orgId: org.id,
        invitedById: ctx.user.id,
        expiresAt: getInvitationExpiry(),
      },
      select: { id: true, email: true, token: true, expiresAt: true },
    })

    await sendMemberInvitationEmail({
      to: email,
      orgName: org.name,
      inviterName: ctx.user.name,
      token: invitation.token,
    })

    return invitation
  }),

  // Liste des invitations en attente de l'orga (owner) + flag d'expiration.
  listPending: protectedProcedure.query(async ({ ctx }) => {
    const org = await getOwnedOrg(ctx)

    const invitations = await ctx.db.memberInvitation.findMany({
      where: { orgId: org.id, status: InvitationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, token: true, expiresAt: true, createdAt: true },
    })

    const now = Date.now()
    return invitations.map((invitation) => ({
      ...invitation,
      isExpired: invitation.expiresAt.getTime() < now,
    }))
  }),

  // Revocation d'une invitation en attente (owner).
  revoke: protectedProcedure.input(invitationIdSchema).mutation(async ({ ctx, input }) => {
    const org = await getOwnedOrg(ctx)

    const invitation = await ctx.db.memberInvitation.findUnique({
      where: { id: input.invitationId },
      select: { id: true, orgId: true, status: true },
    })

    if (!invitation || invitation.orgId !== org.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation introuvable.' })
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette invitation est deja traitee.' })
    }

    await ctx.db.memberInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REVOKED },
    })

    return { id: invitation.id }
  }),

  // Acceptation par le recrute connecte (email doit matcher l'invitation).
  accept: protectedProcedure.input(invitationTokenSchema).mutation(async ({ ctx, input }) => {
    const invitation = await ctx.db.memberInvitation.findUnique({
      where: { token: input.token },
      select: { id: true, email: true, status: true, expiresAt: true, orgId: true },
    })

    if (!invitation) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation introuvable.' })
    }

    const state = getInvitationState(invitation, ctx.user.email, new Date())

    if (state === 'WRONG_RECIPIENT') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cette invitation ne vous est pas destinee.',
      })
    }

    if (state !== 'VALID') {
      // state narrowé à ACCEPTED | REVOKED | DECLINED | EXPIRED (WRONG_RECIPIENT déjà géré).
      const messages = {
        EXPIRED: 'Cette invitation a expire.',
        REVOKED: 'Cette invitation a ete revoquee.',
        DECLINED: 'Vous avez refuse cette invitation.',
        ACCEPTED: 'Cette invitation a deja ete acceptee.',
      } as const
      throw new TRPCError({ code: 'BAD_REQUEST', message: messages[state] })
    }

    // Re-check 1 user = 1 orga dans la transaction (course possible).
    const existingMember = await ctx.db.member.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true },
    })

    if (existingMember) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Vous etes deja membre d’une organisation.',
      })
    }

    await ctx.db.$transaction(async (tx) => {
      await tx.member.create({
        data: { userId: ctx.user.id, orgId: invitation.orgId },
      })
      await tx.memberInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      })
    })

    return { orgId: invitation.orgId }
  }),

  // Refus par le recrute connecte (email doit matcher) : passe l'invitation en DECLINED.
  decline: protectedProcedure.input(invitationTokenSchema).mutation(async ({ ctx, input }) => {
    const invitation = await ctx.db.memberInvitation.findUnique({
      where: { token: input.token },
      select: { id: true, email: true, status: true, expiresAt: true },
    })

    if (!invitation) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation introuvable.' })
    }

    const state = getInvitationState(invitation, ctx.user.email, new Date())

    if (state === 'WRONG_RECIPIENT') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cette invitation ne vous est pas destinee.',
      })
    }

    if (state !== 'VALID') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette invitation est deja traitee.' })
    }

    await ctx.db.memberInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.DECLINED },
    })

    return { id: invitation.id }
  }),
})
