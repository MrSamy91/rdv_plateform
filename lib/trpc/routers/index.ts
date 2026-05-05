// App router racine — combine tous les sous-routers.
// Ajouter ici les nouveaux routers (booking, service, member, review, reward).
import { router } from '../init'
import { organizationRouter } from './organization'

export const appRouter = router({
  organization: organizationRouter,
  // booking: bookingRouter,    // TODO
  // service: serviceRouter,    // TODO
  // member: memberRouter,      // TODO
  // review: reviewRouter,      // TODO
  // reward: rewardRouter,      // TODO
})

// Type exporte pour le client tRPC (autocomplete + types end-to-end)
export type AppRouter = typeof appRouter
