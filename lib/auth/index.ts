// Barrel SERVER public pour l'auth.
// A importer dans : layouts, pages (RSC), Server Actions, route handlers, middleware tRPC.
// PAS dans des composants client -> utiliser `@/lib/auth/client`.
export { auth, getSession } from './server'
