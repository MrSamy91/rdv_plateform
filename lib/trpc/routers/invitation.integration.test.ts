// @vitest-environment node

import 'dotenv/config'

import { beforeAll, describe, expect, it } from 'vitest'
import type { TRPCError } from '@trpc/server'
import { runSeed, seedMembers, seedOrganization, seedUsers } from '@/prisma/seed'
import { db } from '@/lib/db'
import { InvitationStatus } from '@/generated/prisma/enums'
import { appRouter } from '.'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run integration tests')
}

async function createUserCaller(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } })
  const session = {
    id: `test-session-${user.id}`,
    token: `test-token-${user.id}`,
    userId: user.id,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  }

  return appRouter.createCaller({ db, session: { session, user }, user })
}

describe('invitationRouter + gestion equipe', () => {
  beforeAll(async () => {
    await runSeed()
  })

  it('le owner invite un client de la plateforme', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    const result = await owner.invitation.create({ email: seedUsers.clientOne.email })

    expect(result.email).toBe(seedUsers.clientOne.email.toLowerCase())
    expect(result.token).toEqual(expect.any(String))

    const row = await db.memberInvitation.findUnique({ where: { id: result.id } })
    expect(row?.status).toBe(InvitationStatus.PENDING)
    expect(row?.orgId).toBe(seedOrganization.id)
  })

  it('refuse un email inconnu de la plateforme', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    await expect(owner.invitation.create({ email: 'inconnu@nowhere.test' })).rejects.toMatchObject({
      code: 'NOT_FOUND' satisfies TRPCError['code'],
    })
  })

  it('refuse un client deja membre d’une orga', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    await expect(
      owner.invitation.create({ email: seedUsers.memberOne.email }),
    ).rejects.toMatchObject({ code: 'CONFLICT' satisfies TRPCError['code'] })
  })

  it('refuse une invitation en double', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    await expect(
      owner.invitation.create({ email: seedUsers.clientOne.email }),
    ).rejects.toMatchObject({ code: 'CONFLICT' satisfies TRPCError['code'] })
  })

  it('le destinataire accepte et devient membre', async () => {
    const invitation = await db.memberInvitation.findFirstOrThrow({
      where: { email: seedUsers.clientOne.email.toLowerCase(), status: InvitationStatus.PENDING },
    })

    const client = await createUserCaller(seedUsers.clientOne.id)
    const result = await client.invitation.accept({ token: invitation.token })

    expect(result.orgId).toBe(seedOrganization.id)

    const member = await db.member.findUnique({ where: { userId: seedUsers.clientOne.id } })
    expect(member?.orgId).toBe(seedOrganization.id)

    const updated = await db.memberInvitation.findUnique({ where: { id: invitation.id } })
    expect(updated?.status).toBe(InvitationStatus.ACCEPTED)
  })

  it('refuse l’acceptation par le mauvais destinataire', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    const inviteTwo = await owner.invitation.create({ email: seedUsers.clientTwo.email })

    const wrongUser = await createUserCaller(seedUsers.clientOne.id)
    await expect(wrongUser.invitation.accept({ token: inviteTwo.token })).rejects.toMatchObject({
      code: 'FORBIDDEN' satisfies TRPCError['code'],
    })
  })

  it('le owner revoque une invitation en attente', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    const invitation = await db.memberInvitation.findFirstOrThrow({
      where: { email: seedUsers.clientTwo.email.toLowerCase(), status: InvitationStatus.PENDING },
    })

    const result = await owner.invitation.revoke({ invitationId: invitation.id })
    expect(result.id).toBe(invitation.id)

    const updated = await db.memberInvitation.findUnique({ where: { id: invitation.id } })
    expect(updated?.status).toBe(InvitationStatus.REVOKED)
  })

  it('le destinataire refuse une invitation', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    const invite = await owner.invitation.create({ email: seedUsers.clientTwo.email })

    const client = await createUserCaller(seedUsers.clientTwo.id)
    const result = await client.invitation.decline({ token: invite.token })
    expect(result.id).toBe(invite.id)

    const updated = await db.memberInvitation.findUnique({ where: { id: invite.id } })
    expect(updated?.status).toBe(InvitationStatus.DECLINED)
  })

  it('refuse d’accepter une invitation deja refusee', async () => {
    const invitation = await db.memberInvitation.findFirstOrThrow({
      where: { email: seedUsers.clientTwo.email.toLowerCase(), status: InvitationStatus.DECLINED },
    })
    const client = await createUserCaller(seedUsers.clientTwo.id)
    await expect(client.invitation.accept({ token: invitation.token })).rejects.toMatchObject({
      code: 'BAD_REQUEST' satisfies TRPCError['code'],
    })
  })

  it('liste l’equipe incluant le membre fraichement accepte', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    const team = await owner.organization.teamMembers()

    expect(team.some((member) => member.email === seedUsers.clientOne.email)).toBe(true)
  })

  it('le owner ne peut pas se retirer lui-meme', async () => {
    // Le seed ne crée pas la ligne Member du owner (uniquement ownerId) : on la crée.
    const ownerMember = await db.member.upsert({
      where: { userId: seedUsers.owner.id },
      create: { userId: seedUsers.owner.id, orgId: seedOrganization.id },
      update: {},
    })

    const owner = await createUserCaller(seedUsers.owner.id)
    await expect(
      owner.organization.removeMember({ memberId: ownerMember.id }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' satisfies TRPCError['code'] })
  })

  it('refuse de retirer un membre ayant des reservations', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    await expect(
      owner.organization.removeMember({ memberId: seedMembers.leo.id }),
    ).rejects.toMatchObject({ code: 'CONFLICT' satisfies TRPCError['code'] })
  })

  it('retire un membre sans reservation', async () => {
    const owner = await createUserCaller(seedUsers.owner.id)
    const newMember = await db.member.findUniqueOrThrow({
      where: { userId: seedUsers.clientOne.id },
    })

    const result = await owner.organization.removeMember({ memberId: newMember.id })
    expect(result.memberId).toBe(newMember.id)

    const gone = await db.member.findUnique({ where: { id: newMember.id } })
    expect(gone).toBeNull()
  })
})
