// Config BetterAuth — INTERNE au module lib/auth/
// Ne jamais importer ce fichier depuis l'exterieur du module.
// Importer depuis `@/lib/auth` (server) ou `@/lib/auth/client` (client).
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from '@/lib/db'
import { env } from '@/lib/env'

export const authConfig = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),

  // Auth email + password
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // a activer en prod
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // Auth Google OAuth
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },

  // Rate limiting natif BetterAuth
  // Pourquoi : empeche les attaques par brute force sur le login
  rateLimit: {
    enabled: true,
    window: 10, // secondes
    max: 100, // requetes max par fenetre
  },

  // Session config
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // refresh toutes les 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min
    },
  },

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
})
