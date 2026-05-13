import type { Metadata } from 'next'
import { ClientBookingsView } from '@/components/dashboard/client-bookings-view'

export const metadata: Metadata = {
  title: 'Mes reservations - CutBook',
}

export default function ClientBookingsPage() {
  return <ClientBookingsView />
}
