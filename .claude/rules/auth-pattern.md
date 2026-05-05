# Pattern auth — `lib/auth/` strict

Tout le code auth dans **un seul module** `lib/auth/`. Jamais de fichier auth ailleurs.

## Structure

```
lib/auth/
├── index.ts        # Barrel serveur : export { auth, getSession }
├── client.ts       # 'use client' : export { signIn, signOut, useSession }
└── _config.ts      # betterAuth() config + hooks + rateLimit (INTERNE)
```

## Regles strictes

- Fichiers `_prefixes` = internes au module, **jamais importer hors du module**
- Server (`betterAuth()`, Prisma, Node.js) et client (`createAuthClient()`, React hooks) **DOIVENT etre dans des fichiers separes** — contrainte Next.js `'use client'` qui s'applique au fichier entier
- Rate limiting via config BetterAuth native (`rateLimit`), pas de server actions custom
- Validations pre-login dans le hook `before` de BetterAuth
- Login form = **1 seul appel** `signIn.email()`. Ne jamais mixer `callbackURL` + `fetchOptions.onSuccess` (race condition cookie)

## Import paths

```typescript
// Server (layout, page RSC, server action, route handler, middleware tRPC)
import { getSession } from '@/lib/auth'

// Client (composant avec 'use client')
import { signIn, useSession } from '@/lib/auth/client'
```

## Pattern login form

```typescript
await signIn.email({
  email,
  password,
  fetchOptions: {
    onResponse: (ctx) => {
      if (ctx.response.status === 429) setError('Rate limit')
      if (ctx.response.status === 403) {
        /* check error code */
      }
    },
    onSuccess: () => {
      window.location.href = '/dashboard'
    },
    onError: () => {
      setError('Credentials invalides')
    },
  },
})
```

- `onResponse` : intercepte les status codes (429 rate limit, 403 erreurs metier)
- `onSuccess` : cookie garanti ecrit, safe pour rediriger
- `onError` : credentials invalides (401)
- `callbackURL` : reserve aux flows OAuth (Google) qui redirigent vers un provider externe
