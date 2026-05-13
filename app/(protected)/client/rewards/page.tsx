import type { Metadata } from 'next'
import { ClientRewardsView } from '@/components/dashboard/client-rewards-view'

export const metadata: Metadata = {
  title: 'Programme fidelite - CutBook',
}

export default function ClientRewardsPage() {
  return <ClientRewardsView />
}
