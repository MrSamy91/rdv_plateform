'use client'

// Barrel CLIENT pour l'auth.
// A importer dans : composants client (avec 'use client').
// PAS dans des composants serveur → utiliser `@/lib/auth`.
import { createAuthClient } from 'better-auth/react'
import { getAppUrl } from '@/lib/env'

const authClient = createAuthClient({
  baseURL: getAppUrl(),
})

export const { signIn, signUp, signOut, useSession } = authClient
