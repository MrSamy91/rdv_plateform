import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ResendVerificationEmailButton } from './resend-verification-email-button'

const authMocks = vi.hoisted(() => ({
  sendVerificationEmail: vi.fn(),
}))

vi.mock('@/lib/auth/client', () => ({
  authClient: {
    sendVerificationEmail: authMocks.sendVerificationEmail,
  },
}))

describe('ResendVerificationEmailButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    authMocks.sendVerificationEmail.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('active le renvoi apres 60 secondes puis relance le compte a rebours', async () => {
    authMocks.sendVerificationEmail.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions.onSuccess()
    })

    render(<ResendVerificationEmailButton email="client@example.com" />)

    const button = screen.getByRole('button', { name: 'Renvoyer dans 60s' })
    expect(button).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Renvoyer le mail' }))

    await act(async () => {
      await Promise.resolve()
    })

    expect(authMocks.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'client@example.com',
        callbackURL: '/verify-email/success',
      }),
    )
    expect(screen.getByRole('button', { name: 'Renvoyer dans 60s' })).toBeDisabled()
  })
})
