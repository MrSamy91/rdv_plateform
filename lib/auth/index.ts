// Barrel SERVER pour l'auth.
// A importer dans : layouts, pages (RSC), Server Actions, route handlers, middleware tRPC.
// PAS dans des composants client → utiliser `@/lib/auth/client`.
import { headers } from 'next/headers'
import { authConfig } from './_config'

export const auth = authConfig

/**
 * Recupere la session de l'utilisateur cote serveur.
 * Retourne `null` si pas connecte.
 *
 * Usage :
 *   const session = await getSession()
 *   if (!session) redirect('/login')
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  })
}
