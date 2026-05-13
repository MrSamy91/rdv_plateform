import type { Metadata } from 'next'
import { CalendarDays } from 'lucide-react'
import { MemberPlaceholderView } from '@/components/dashboard/member-placeholder-view'

export const metadata: Metadata = { title: 'Mon calendrier - CutBook' }

export default function MemberCalendarPage() {
  return (
    <MemberPlaceholderView
      title="Mon calendrier"
      icon={CalendarDays}
      headline="Calendrier - en cours d'implementation"
      description="FullCalendar sera integre ici (J13)."
    />
  )
}
