import { CalendarDays, Clock } from 'lucide-react'

type HistoryStatus = 'COMPLETED' | 'CANCELLED'

interface ClientHistoryItem {
  id: string
  org: string
  service: string
  member: string
  date: string
  time: string
  price: number
  status: HistoryStatus
}

const statusStyles = {
  COMPLETED: { background: 'rgba(72,155,110,0.1)', color: '#489B6E', label: 'Termine' },
  CANCELLED: { background: 'rgba(37,49,34,0.06)', color: 'rgba(37,49,34,0.4)', label: 'Annule' },
} satisfies Record<HistoryStatus, { background: string; color: string; label: string }>

interface ClientHistoryViewProps {
  history?: ClientHistoryItem[]
}

export function ClientHistoryView({ history = [] }: ClientHistoryViewProps) {
  const completed = history.filter((booking) => booking.status === 'COMPLETED')
  const totalSpent = completed.reduce((sum, booking) => sum + booking.price, 0)
  const cancelledCount = history.filter((booking) => booking.status === 'CANCELLED').length

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
          >
            <p
              className="mb-3 text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(37,49,34,0.4)' }}
            >
              Bilan
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-black" style={{ color: '#253122' }}>
                  {completed.length}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'rgba(37,49,34,0.45)' }}>
                  RDV realises
                </p>
              </div>
              <div className="border-t pt-4" style={{ borderColor: 'rgba(37,49,34,0.06)' }}>
                <p className="text-3xl font-black" style={{ color: '#253122' }}>
                  {totalSpent} EUR
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'rgba(37,49,34,0.45)' }}>
                  Total depense
                </p>
              </div>
              <div className="border-t pt-4" style={{ borderColor: 'rgba(37,49,34,0.06)' }}>
                <p className="text-3xl font-black" style={{ color: '#253122' }}>
                  {cancelledCount}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'rgba(37,49,34,0.45)' }}>
                  Annules
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3" aria-label="Historique des reservations">
          {history.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-2xl border p-16 text-center"
              style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff', minHeight: '280px' }}
            >
              <CalendarDays size={40} className="mb-4" style={{ color: 'rgba(37,49,34,0.12)' }} />
              <p className="font-semibold" style={{ color: '#253122' }}>
                Aucun RDV passe
              </p>
              <p className="mt-1 text-sm" style={{ color: 'rgba(37,49,34,0.45)' }}>
                Votre historique apparaitra ici apres votre premier rendez-vous.
              </p>
            </div>
          ) : (
            <ol className="space-y-3">
              {history.map((booking) => {
                const style = statusStyles[booking.status]

                return (
                  <li
                    key={booking.id}
                    className="rounded-2xl border p-5"
                    style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: '#253122' }}>
                            {booking.org}
                          </p>
                          <span
                            className="rounded-md px-2 py-0.5 text-xs font-semibold"
                            style={{ background: style.background, color: style.color }}
                          >
                            {style.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm" style={{ color: 'rgba(37,49,34,0.5)' }}>
                          {booking.service} - {booking.member}
                        </p>
                        <div
                          className="mt-2 flex items-center gap-3 text-xs"
                          style={{ color: 'rgba(37,49,34,0.4)' }}
                        >
                          <span className="flex items-center gap-1">
                            <CalendarDays size={11} />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {booking.time}
                          </span>
                          <span className="font-semibold" style={{ color: '#253122' }}>
                            {booking.price} EUR
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
