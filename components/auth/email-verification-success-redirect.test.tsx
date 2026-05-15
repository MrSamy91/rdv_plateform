import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { EmailVerificationSuccessRedirect } from './email-verification-success-redirect'

describe('EmailVerificationSuccessRedirect', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('redirige vers /client apres 5 secondes', () => {
    render(<EmailVerificationSuccessRedirect />)

    expect(screen.getByText(/Redirection vers ton espace dans 5s/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(window.location.href).toBe('/client')
  })
})
