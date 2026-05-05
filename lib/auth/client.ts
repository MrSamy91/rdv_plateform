'use client'

// Barrel CLIENT pour l'auth.
// A importer dans : composants client (avec 'use client').
// PAS dans des composants serveur → utiliser `@/lib/auth`.
import { createAuthClient } from 'better-auth/react'

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
})

export const { signIn, signUp, signOut, useSession } = authClient
