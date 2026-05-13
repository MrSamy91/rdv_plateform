import type { Metadata } from 'next'
import { Clock } from 'lucide-react'
import { MemberPlaceholderView } from '@/components/dashboard/member-placeholder-view'

export const metadata: Metadata = { title: 'Mes creneaux - CutBook' }

export default function MemberAvailabilityPage() {
  return (
    <MemberPlaceholderView
      title="Mes creneaux"
      icon={Clock}
      headline="Gestion des creneaux - en cours d'implementation"
      description="La gestion des disponibilites sera implementee ici (J14)."
    />
  )
}
