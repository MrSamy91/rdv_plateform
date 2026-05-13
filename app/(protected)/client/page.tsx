import type { Metadata } from 'next'
import { ClientDashboardOverview } from '@/components/dashboard/client-dashboard-overview'

export const metadata: Metadata = {
  title: 'Mon espace - CutBook',
  description: 'Gerez vos reservations et consultez votre programme de fidelite.',
}

export default function ClientDashboardPage() {
  return <ClientDashboardOverview />
}
