import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getMemberDashboardSummary } from '@/lib/member/dashboard'
import { getMemberBookingsPerDay } from '@/lib/member/chart-stats'
import { MemberSectionCards } from '@/components/dashboard/member-section-cards'
import { ChartAreaInteractive } from '@/components/admin/chart-area-interactive'
import { MemberNextBookings } from '@/components/dashboard/member-next-bookings'

export const metadata: Metadata = {
  title: 'Espace professionnel — CutBook',
}

export default async function MemberDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const member = await db.member.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!member) redirect('/client')

  const [summary, chartData] = await Promise.all([
    getMemberDashboardSummary(session.user.id),
    getMemberBookingsPerDay(member.id, 30, 30),
  ])

  if (!summary) redirect('/client')

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Stat cards */}
        <MemberSectionCards
          stats={{
            todayBookingsCount: summary.todayBookingsCount,
            weekBookingsCount: summary.weekBookingsCount,
            monthClientsCount: summary.monthClientsCount,
            averageRating: summary.averageRating,
            reviewsCount: summary.reviewsCount,
          }}
        />

        {/* Graphique */}
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive data={chartData} />
        </div>

        {/* Prochains rendez-vous */}
        <MemberNextBookings bookings={summary.nextBookings} />
      </div>
    </div>
  )
}
