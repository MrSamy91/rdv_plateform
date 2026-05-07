import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthShell } from './auth-shell'

describe('AuthShell', () => {
  it('rend le shell auth avec le contenu de page sans navigation publique', () => {
    render(
      <AuthShell
        title="Bon retour"
        description="Connectez-vous pour acceder a votre espace."
        brandTitle="Vos clients reservent"
        brandHighlight="meme quand vous dormez."
        brandDescription="Reservation en ligne et paiement securise."
      >
        <button type="button">Se connecter</button>
      </AuthShell>,
    )

    expect(screen.getByRole('heading', { name: 'Bon retour' })).toBeInTheDocument()
    expect(screen.getByText('Connectez-vous pour acceder a votre espace.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
