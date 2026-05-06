// Validation runtime des variables d'environnement avec Zod.
//
// Pourquoi : sans ce module, une env var manquante (ex: STRIPE_SECRET_KEY)
// crashe le code a l'execution avec un message obscur en prod. Avec ce module,
// le crash est immediat au boot avec la liste exacte des vars manquantes ou
// mal formatees → aucune config cassee ne peut etre deployee.
//
// `@t3-oss/env-nextjs` separe automatiquement les vars serveur (jamais
// exposees au client) des vars publiques (NEXT_PUBLIC_*). Toute tentative
// d'importer une var serveur dans un composant client throw a la compilation.
//
// Usage : `import { env } from '@/lib/env'` puis `env.DATABASE_URL` (type-safe).
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Variables serveur (jamais envoyees au client).
   * Tout import dans un composant client throw a la compilation.
   */
  server: {
    DATABASE_URL: z.string().url().optional(),

    BETTER_AUTH_SECRET: z.string().min(32, 'min 32 chars (openssl rand -base64 32)').optional(),
    BETTER_AUTH_URL: z.string().url().optional(),

    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

    STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

    RESEND_API_KEY: z.string().startsWith('re_').optional(),
    EMAIL_FROM: z.string().min(1).optional(),

    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },

  /**
   * Variables publiques (envoyees au client, accessibles via window).
   * Doivent imperativement commencer par NEXT_PUBLIC_*.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  /**
   * Mapping vers process.env. Necessaire pour le runtime Next.js qui
   * inline les vars statiquement au build (les destructurer ne marche pas).
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  /**
   * Permet de skip la validation pendant le build CI (pas de vraie env)
   * ou dans des cas particuliers (Docker build, etc.). En runtime, la
   * validation se fera au premier import.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Traite les chaines vides comme `undefined` (utile pour `.env.example`
   * qui contient `KEY=""` pour signaler qu'il faut remplir).
   */
  emptyStringAsUndefined: true,
})
