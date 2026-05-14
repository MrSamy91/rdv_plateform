import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './login-form'

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signInSocial: vi.fn(),
}))

vi.mock('@/lib/auth/client', () => ({
  signIn: {
    email: authMocks.signInEmail,
    social: authMocks.signInSocial,
  },
}))

describe('LoginForm', () => {
  it('connecte avec BetterAuth email et redirige vers /client en succes', async () => {
    const user = userEvent.setup()
    const originalLocation = window.location

    authMocks.signInEmail.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions.onSuccess()
    })

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    })

    render(<LoginForm />)

    await user.type(screen.getByLabelText('Adresse email'), 'client@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password-123')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => {
      expect(authMocks.signInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'client@example.com',
          password: 'password-123',
          fetchOptions: expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
            onResponse: expect.any(Function),
          }),
        }),
      )
      expect(window.location.href).toBe('/client')
    })

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it("affiche un message quand l'email n'est pas verifie", async () => {
    const user = userEvent.setup()

    authMocks.signInEmail.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions.onResponse({ response: { status: 403 } })
    })

    render(<LoginForm />)

    await user.type(screen.getByLabelText('Adresse email'), 'client@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password-123')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vérifie ton email avant de te connecter.',
    )
  })
})
