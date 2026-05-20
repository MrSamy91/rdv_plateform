// App router racine — combine tous les sous-routers.
// Ajouter ici les nouveaux routers (booking, service, member, review, reward).
import { router } from '../init'
import { bookingRouter } from './booking'
import { clientRouter } from './client'
import { memberRouter } from './member'
import { organizationRouter } from './organization'
import { serviceRouter } from './service'
import { timeSlotRouter } from './time-slot'

export const appRouter = router({
  organization: organizationRouter,
  booking: bookingRouter,
  service: serviceRouter,
  timeSlot: timeSlotRouter,
  clientPortal: clientRouter,
  memberPortal: memberRouter,
  // review: reviewRouter,      // TODO
  // reward: rewardRouter,      // TODO
})

// Type exporte pour le client tRPC (autocomplete + types end-to-end)
export type AppRouter = typeof appRouter
