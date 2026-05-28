// App router racine — combine tous les sous-routers.
// Ajouter ici les nouveaux routers (booking, service, member, review, reward).
import { router } from '../init'
import { adminRouter } from './admin'
import { bookingRouter } from './booking'
import { clientRouter } from './client'
import { invitationRouter } from './invitation'
import { memberRouter } from './member'
import { organizationRouter } from './organization'
import { paymentRouter } from './payment'
import { serviceRouter } from './service'
import { timeSlotRouter } from './time-slot'

export const appRouter = router({
  admin: adminRouter,
  organization: organizationRouter,
  booking: bookingRouter,
  payment: paymentRouter,
  service: serviceRouter,
  timeSlot: timeSlotRouter,
  invitation: invitationRouter,
  clientPortal: clientRouter,
  memberPortal: memberRouter,
  // review: reviewRouter,      // TODO
  // reward: rewardRouter,      // TODO
})

// Type exporte pour le client tRPC (autocomplete + types end-to-end)
export type AppRouter = typeof appRouter
