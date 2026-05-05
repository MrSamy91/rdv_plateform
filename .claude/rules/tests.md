# Tests

## Stack

- **Vitest** (Jest mais 5× plus rapide, base sur Vite)
- **Testing Library** (test des composants comme un user les utiliserait)
- **jsdom** (env DOM pour Vitest)

## Convention de fichiers

- Fichier de test **a cote du code teste** (pas de dossier `__tests__/` separe).
- Nommage : `<fichier>.test.ts` ou `<fichier>.test.tsx`.

```
lib/utils/format-price.ts
lib/utils/format-price.test.ts

components/booking/booking-form.tsx
components/booking/booking-form.test.tsx
```

## Scripts

```bash
pnpm test         # Run unique (mode CI)
pnpm test:watch   # Watch mode (dev)
pnpm test:ui      # UI Vitest dans le navigateur
```

## Quoi tester

### Prioritaire

- **Logique metier critique** : calcul de prix, validation booking, etc.
- **Utils complexes** : `format-price`, `slugify`, `parse-date`...
- **Hooks custom** : `use-current-org`, `use-booking-form`...
- **Server actions / tRPC procedures** : avec mocks Prisma.

### Secondaire

- **Composants UI complexes** (forms multi-etapes, calendrier).
- **Edge cases** des composants UI critiques (booking flow).

### A ne pas tester

- Composants shadcn/ui (deja testes par eux).
- Code Next.js framework.
- Auto-generated (Prisma client).

## Pattern de test composant

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { BookingForm } from './booking-form'

describe('BookingForm', () => {
  it('soumet le formulaire avec les bonnes valeurs', async () => {
    const onSubmit = vi.fn()
    render(<BookingForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.click(screen.getByRole('button', { name: /reserver/i }))

    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
  })
})
```

## Pre-commit hook

Le pre-commit lance `vitest related --run --passWithNoTests` sur les fichiers stages — donc seuls les tests **lies** aux fichiers modifies tournent. Rapide.
