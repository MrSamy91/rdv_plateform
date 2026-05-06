'use client'

// Barrel CLIENT pour l'auth.
// A importer dans : composants client (avec 'use client').
// PAS dans des composants serveur → utiliser `@/lib/auth`.
import { createAuthClient } from 'better-auth/react'
import { getClientAppUrl } from '@/lib/env'

const authClient = createAuthClient({
  baseURL: getClientAppUrl(),
})

export const { signIn, signUp, signOut, useSession } = authClient
