import type { Metadata } from 'next'
import { MemberAvailabilityView } from '@/components/dashboard/member-availability-view'

export const metadata: Metadata = { title: 'Mes creneaux - CutBook' }

export default function MemberAvailabilityPage() {
  return <MemberAvailabilityView />
}
