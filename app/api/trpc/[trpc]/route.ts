// Catch-all route pour tRPC.
// Toutes les requetes /api/trpc/* sont routees vers le bon procedure.
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext } from '@/lib/trpc/init'
import { appRouter } from '@/lib/trpc/routers'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error(`❌ tRPC error on ${path ?? '<unknown>'}: ${error.message}`)
      }
    },
  })

export { handler as GET, handler as POST }
