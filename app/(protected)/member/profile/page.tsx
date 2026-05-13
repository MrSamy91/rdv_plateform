import type { Metadata } from 'next'
import { MemberProfileView } from '@/components/dashboard/member-profile-view'

export const metadata: Metadata = { title: 'Mon profil - CutBook' }

export default function MemberProfilePage() {
  return <MemberProfileView />
}
