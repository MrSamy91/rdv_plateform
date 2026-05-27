import { describe, expect, it } from 'vitest'
import { InvitationStatus } from '@/generated/prisma/enums'
import { getInvitationExpiry, getInvitationState, INVITATION_TTL_DAYS } from './state'

const now = new Date('2026-05-28T00:00:00.000Z')
const base = {
  status: InvitationStatus.PENDING,
  expiresAt: new Date('2026-06-01T00:00:00.000Z'),
  email: 'client@cutbook.test',
}

describe('getInvitationState', () => {
  it('VALID si PENDING, non expirée, bon destinataire', () => {
    expect(getInvitationState(base, 'client@cutbook.test', now)).toBe('VALID')
  })

  it('insensible à la casse de l’email', () => {
    expect(getInvitationState(base, 'CLIENT@CutBook.test', now)).toBe('VALID')
  })

  it('ACCEPTED prioritaire si déjà acceptée', () => {
    expect(
      getInvitationState(
        { ...base, status: InvitationStatus.ACCEPTED },
        'client@cutbook.test',
        now,
      ),
    ).toBe('ACCEPTED')
  })

  it('REVOKED si révoquée', () => {
    expect(
      getInvitationState({ ...base, status: InvitationStatus.REVOKED }, 'client@cutbook.test', now),
    ).toBe('REVOKED')
  })

  it('EXPIRED si expiresAt < now', () => {
    expect(
      getInvitationState(
        { ...base, expiresAt: new Date('2026-05-01T00:00:00.000Z') },
        'client@cutbook.test',
        now,
      ),
    ).toBe('EXPIRED')
  })

  it('WRONG_RECIPIENT si l’email ne correspond pas', () => {
    expect(getInvitationState(base, 'autre@cutbook.test', now)).toBe('WRONG_RECIPIENT')
  })
})

describe('getInvitationExpiry', () => {
  it(`ajoute ${INVITATION_TTL_DAYS} jours`, () => {
    const from = new Date('2026-05-28T10:00:00.000Z')
    const expiry = getInvitationExpiry(from)
    const diffDays = Math.round((expiry.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
    expect(diffDays).toBe(INVITATION_TTL_DAYS)
  })
})
