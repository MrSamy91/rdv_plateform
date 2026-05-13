import type { Metadata } from 'next'
import { MemberDashboardOverview } from '@/components/dashboard/member-dashboard-overview'

export const metadata: Metadata = {
  title: 'Espace professionnel - CutBook',
}

export default function MemberDashboardPage() {
  return <MemberDashboardOverview />
}
