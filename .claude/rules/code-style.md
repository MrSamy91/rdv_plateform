# Code style

## Server Components par defaut

- **Privilegier les Server Components** (RSC). Tout est Server Component par defaut dans Next.js App Router.
- Ne mettre `"use client"` **QUE quand strictement necessaire** :
  - Hooks React (`useState`, `useEffect`, `useRef`, `useRouter`, etc.)
  - Event handlers (`onClick`, `onChange`, `onSubmit`)
  - Browser API (`window`, `localStorage`, `IntersectionObserver`)
- Si un composant peut etre Server, il **doit** l'etre.
- Pourquoi : Server Components = pas de JS envoye au client, page plus rapide, meilleur SEO.

## Pas de duplication

- Reutiliser composants, hooks, utilitaires existants.
- **Toujours verifier** si un composant similaire existe avant d'en creer un nouveau.
- Privilegier l'edition de fichiers existants a la creation de nouveaux fichiers.

## Commenter le pourquoi, pas le quoi

- Les noms de variables doivent expliquer le **quoi**.
- Les commentaires doivent expliquer le **pourquoi** (contraintes, choix non-evidents, edge cases).
- Pas de commentaires redondants (`i++ // increment i`).

## Validation

- Validation **Zod** **cote serveur**. Ne jamais faire confiance au client sur les inputs externes :
  - tRPC procedures (input schemas)
  - Server Actions
  - API routes
  - Formulaires (RHF integre Zod via `zodResolver`)
- Roles & permissions verifies **cote serveur** (middleware tRPC), jamais cote client uniquement.

## TypeScript

- `any` **interdit**. Si tu hesites, utilise `unknown` puis narrow.
- Mode strict + `noUncheckedIndexedAccess` actifs : tu ne peux pas faire `array[0]` sans gerer le `undefined`.
- Privilegier les types inferes plutot que les types explicites (laisse TS deduire quand possible).

## Erreurs et fallbacks

- Ne pas ajouter de fallbacks pour des cas qui ne peuvent pas arriver.
- Faire confiance au code interne et aux garanties du framework.
- Valider uniquement aux frontieres systeme (input user, API externes).
- Pas de feature flags ni shims de retro-compat — modifier directement le code.
