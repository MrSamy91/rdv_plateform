import type { Metadata } from 'next'
import { User } from 'lucide-react'
import { MemberPlaceholderView } from '@/components/dashboard/member-placeholder-view'

export const metadata: Metadata = { title: 'Mon profil - CutBook' }

export default function MemberProfilePage() {
  return (
    <MemberPlaceholderView
      title="Mon profil"
      icon={User}
      headline="Profil - en cours d'implementation"
      description="Gestion du profil professionnel (bio, specialites, photo)."
    />
  )
}
