// Auth SERVER.
// A importer directement seulement si tu veux expliciter le runtime serveur.
// L'import public recommande reste `@/lib/auth`.
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
