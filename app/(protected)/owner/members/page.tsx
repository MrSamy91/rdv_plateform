import type { Metadata } from 'next'
import { requireOwner } from '@/lib/auth'
import { OwnerMembersView } from '@/components/dashboard/owner-members-view'

export const metadata: Metadata = { title: 'Équipe - CutBook' }

export default async function OwnerMembersPage() {
  await requireOwner()
  return <OwnerMembersView />
}
