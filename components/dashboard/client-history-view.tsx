'use client'

import { CalendarDays, Clock, Receipt } from 'lucide-react'
import type { BookingStatus } from '@/generated/prisma/enums'
import { trpc } from '@/lib/trpc/client'

interface ClientHistoryItem {
  id: string
  org: string
  service: string
  member: string
  date: string
  time: string
  price: number
  status: BookingStatus
  paidOnline: boolean
  receiptUrl: string | null
}

const statusStyles = {
  PENDING: { background: 'rgba(197,165,110,0.12)', color: '#C5A56E', label: 'En attente' },
  CONFIRMED: { background: 'rgba(72,155,110,0.12)', color: '#489B6E', label: 'Confirme' },
  COMPLETED: { background: 'rgba(72,155,110,0.1)', color: '#489B6E', label: 'Termine' },
  CANCELLED: { background: 'rgba(37,49,34,0.06)', color: 'rgba(37,49,34,0.4)', label: 'Annule' },
} satisfies Record<BookingStatus, { background: string; color: string; label: string }>

function ClientHistoryContent({ history }: { history: ClientHistoryItem[] }) {
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
                          {booking.paidOnline && (
                            <span
                              className="rounded-md px-2 py-0.5 text-xs font-semibold"
                              style={{ background: 'rgba(72,155,110,0.12)', color: '#489B6E' }}
                            >
                              Paye en ligne
                            </span>
                          )}
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
                          {booking.receiptUrl && (
                            <a
                              href={booking.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-medium transition-opacity hover:opacity-70"
                              style={{ color: '#489B6E' }}
                            >
                              <Receipt size={11} />
                              Recu
                            </a>
                          )}
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

export function ClientHistoryView() {
  const history = trpc.clientPortal.bookingHistory.useQuery()

  if (history.isLoading) {
    return (
      <div
        className="rounded-2xl border p-8 text-sm"
        style={{
          borderColor: 'rgba(37,49,34,0.08)',
          background: '#fff',
          color: 'rgba(37,49,34,0.55)',
        }}
      >
        Chargement de l&apos;historique...
      </div>
    )
  }

  if (history.isError) {
    return (
      <div
        className="rounded-2xl border p-8 text-sm"
        style={{
          borderColor: 'rgba(220,38,38,0.18)',
          background: 'rgba(220,38,38,0.04)',
          color: '#dc2626',
        }}
      >
        Impossible de charger votre historique.
      </div>
    )
  }

  return <ClientHistoryContent history={history.data?.bookings ?? []} />
}
