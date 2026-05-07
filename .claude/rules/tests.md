# Tests

## Discipline test-first

Toute nouvelle implementation non triviale doit commencer par un test qui echoue.

Cycle attendu :

1. **Red** : ecrire le test du comportement attendu, le lancer, verifier qu'il echoue pour une raison pertinente.
2. **Green** : implementer le minimum propre pour faire passer le test, sans ajouter de feature bonus.
3. **Refactor** : nettoyer le code si necessaire sans changer le comportement, puis relancer les tests.

Exceptions acceptees :

- documentation uniquement
- styling purement visuel sans logique
- config sans comportement testable directement
- spike/prototype explicitement jete

Si une implementation est faite avant le test, ajouter au minimum un test de regression avant de considerer la tache terminee.

Un bon test doit pouvoir echouer si un vrai bug metier est introduit. Un simple test "retourne 200" est un smoke test : utile, mais insuffisant pour valider une feature critique.

## Repartition cible

Objectif global inspire de la pyramide de tests :

- **70% unit tests** : rapides, nombreux, proches de la logique metier.
- **25% integration tests** : tRPC, Prisma, auth, permissions, transactions.
- **5% E2E tests** : parcours navigateur critiques uniquement.

Les E2E sont chers et fragiles : les reserver aux flows qui cassent la demo ou le produit si KO (auth, booking complet, paiement).

## Stack

- **Vitest** (Jest-like, rapide, base sur Vite)
- **Testing Library** (test des composants comme un user les utiliserait)
- **jsdom** (env DOM pour Vitest)
- **Playwright** plus tard pour les E2E critiques

## Convention de fichiers

- Fichier de test **a cote du code teste** (pas de dossier `__tests__/` separe).
- Nommage : `<fichier>.test.ts` ou `<fichier>.test.tsx`.

```text
lib/utils/format-price.ts
lib/utils/format-price.test.ts

components/booking/booking-form.tsx
components/booking/booking-form.test.tsx
```

## Scripts

```bash
pnpm test              # Unit/component tests, sans BDD obligatoire
pnpm test:integration  # Integration tests avec vraie BDD (DATABASE_URL requis)
pnpm test:watch        # Watch mode (dev)
pnpm test:ui           # UI Vitest dans le navigateur
```

## Types de tests

### Unit tests

Tester une unite isolee, sans BDD, sans reseau, sans framework :

- schemas Zod d'inputs externes
- logique metier pure : prix, statuts, permissions simples
- helpers date/prix/slug
- utils complexes
- hooks custom sans dependance serveur

Exemples :

- `can-cancel-booking`
- `calculate-booking-price`
- `format-price`
- `slugify`

### Integration tests

Tester plusieurs morceaux ensemble quand la feature depend de Prisma, tRPC, auth ou d'une transaction :

- tRPC procedures avec contexte de test
- queries/mutations Prisma sur une BDD de test
- permissions serveur (`protectedProcedure`, roles owner/member/client)
- coherence des relations `Organization` / `Member` / `Service` / `TimeSlot`
- anti-double-booking et changements de statut

Exemples booking :

- cree une reservation si le creneau est disponible
- refuse une reservation si le creneau est deja pris
- utilise le prix du service en BDD, jamais un prix envoye par le client
- marque le creneau indisponible apres reservation
- refuse un service qui n'appartient pas a la meme organisation que le membre

Convention :

- nommer ces fichiers `*.integration.test.ts` ou `*.integration.test.tsx`
- les lancer avec `pnpm test:integration`
- `DATABASE_URL` est requis et doit pointer vers une BDD de test/dev, jamais prod
- `pnpm test` ne doit jamais exiger `DATABASE_URL`

### E2E tests

Tester un vrai parcours navigateur uniquement pour les chemins critiques :

- login client
- booking complet client
- paiement Stripe en mode test
- dashboard client "Mes RDV"
- dashboard membre calendrier / annulation

Les E2E ne remplacent pas les unit/integration tests. Ils prouvent que le parcours complet est branche correctement.

## Priorites

### Prioritaire

- **Logique metier critique** : calcul de prix, validation booking, anti-double-booking, permissions.
- **Utils complexes** : `format-price`, `slugify`, `parse-date`.
- **Schemas Zod** : validation des inputs externes.
- **Server actions / tRPC procedures** : avec contexte de test et BDD de test quand la logique depend de Prisma.

### Secondaire

- **Composants UI complexes** : forms multi-etapes, calendrier, booking flow.
- **Edge cases** des composants UI critiques.

### A ne pas tester

- Composants shadcn/ui (deja testes par eux).
- Code Next.js framework.
- Auto-generated (Prisma client).
- Implementation interne de libs tierces.

## Comment choisir le niveau

Se poser ces questions avant d'ecrire le test :

- La regle peut etre testee sans BDD ni framework ? **Unit test**.
- Le bug possible vient des relations BDD, permissions, transactions ou tRPC ? **Integration test**.
- Le risque est un parcours utilisateur complet casse dans le navigateur ? **E2E test**.

Preference senior : attraper le bug au niveau le moins cher. Ne pas utiliser un E2E si un integration test suffit.

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

## Pattern de test metier

```ts
import { describe, expect, it } from 'vitest'
import { canCancelBooking } from './can-cancel-booking'

describe('canCancelBooking', () => {
  it('autorise une annulation tant que le booking est confirme', () => {
    expect(canCancelBooking({ status: 'CONFIRMED' })).toBe(true)
  })

  it('refuse une annulation apres completion', () => {
    expect(canCancelBooking({ status: 'COMPLETED' })).toBe(false)
  })
})
```

## Pattern integration tRPC

Les tests d'integration doivent preparer explicitement leurs donnees, appeler le vrai router/procedure, puis verifier l'etat final en BDD.

```ts
it('cree une reservation et rend le creneau indisponible', async () => {
  const result = await caller.booking.create({
    memberId,
    serviceId,
    timeSlotId,
  })

  expect(result.status).toBe('CONFIRMED')

  const slot = await db.timeSlot.findUnique({ where: { id: timeSlotId } })
  expect(slot?.isAvailable).toBe(false)
})
```

Pour les tests d'integration Prisma/tRPC, utiliser une BDD de test dediee (`DATABASE_URL_TEST`) des qu'elle existe. Ne jamais polluer Neon production avec les tests automatises.

## Pre-commit hook

Le pre-commit lance `vitest related --run --passWithNoTests` sur les fichiers stages, donc seuls les tests **lies** aux fichiers modifies tournent. Rapide.
