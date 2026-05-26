import { ChartAreaInteractive } from '@/components/admin/chart-area-interactive'
import { DataTable } from '@/components/data-table'
import { SectionCards } from '@/components/admin/section-cards'
import { getAdminStats, getBookingsPerDay } from '@/lib/admin/stats'

export default async function AdminPage() {
  const [stats, chartData] = await Promise.all([
    getAdminStats(),
    getBookingsPerDay(90, 90), // 90j passés + 90j futurs
  ])

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards stats={stats} />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive data={chartData} />
        </div>
        <DataTable data={[]} />
      </div>
    </div>
  )
}
