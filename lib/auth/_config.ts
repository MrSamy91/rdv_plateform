// Config BetterAuth — INTERNE au module lib/auth/
// Ne jamais importer ce fichier depuis l'exterieur du module.
// Importer depuis `@/lib/auth` (server) ou `@/lib/auth/client` (client).
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from '@/lib/db'
import { sendEmail, VerifyEmailTemplate } from '@/lib/email'
import { env, getServerAppUrl } from '@/lib/env'

function getVerificationSuccessUrl(url: string) {
  try {
    const verificationUrl = new URL(url)
    const callbackUrl = verificationUrl.searchParams.get('callbackURL')

    if (!callbackUrl || callbackUrl === '/') {
      verificationUrl.searchParams.set('callbackURL', `${getServerAppUrl()}/verify-email/success`)
    }

    return verificationUrl.toString()
  } catch {
    return url
  }
}

export const authConfig = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),

  user: {
    additionalFields: {
      role: {
        type: 'string',
        input: false,
        required: false,
        defaultValue: 'CLIENT',
      },
    },
  },

  // Auth email + password
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      const verificationUrl = getVerificationSuccessUrl(url)

      await sendEmail({
        to: user.email,
        subject: 'Confirme ton email CutBook',
        react: VerifyEmailTemplate({ name: user.name, verificationUrl }),
        text: `Confirme ton adresse email CutBook : ${verificationUrl}`,
        tags: [
          {
            name: 'type',
            value: 'email-verification',
          },
        ],
      })
    },
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

  secret: env.BETTER_AUTH_SECRET ?? 'development-only-insecure-secret-change-me',
  baseURL: getServerAppUrl(),
})
