import type { Metadata } from 'next'
import { MemberCalendarView } from '@/components/dashboard/member-calendar-view'

export const metadata: Metadata = { title: 'Mon calendrier - CutBook' }

export default function MemberCalendarPage() {
  return <MemberCalendarView />
}
