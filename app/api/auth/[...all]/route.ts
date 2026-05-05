// Catch-all route pour BetterAuth.
// Toutes les requetes auth (signin, signup, signout, callback OAuth, etc.)
// passent par /api/auth/* et sont gerees par BetterAuth.
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { POST, GET } = toNextJsHandler(auth)
