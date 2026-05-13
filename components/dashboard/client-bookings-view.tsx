import { CalendarDays, ChevronRight, Clock, Plus, X } from 'lucide-react'
import Link from 'next/link'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

interface ClientBooking {
  id: string
  org: string
  service: string
  member: string
  date: string
  time: string
  price: number
  status: BookingStatus
}

const statusLabels: Record<BookingStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirme',
  CANCELLED: 'Annule',
}

const statusStyles = {
  PENDING: { background: 'rgba(197,165,110,0.12)', color: '#C5A56E' },
  CONFIRMED: { background: 'rgba(72,155,110,0.12)', color: '#489B6E' },
  CANCELLED: { background: 'rgba(37,49,34,0.08)', color: 'rgba(37,49,34,0.4)' },
} satisfies Record<BookingStatus, { background: string; color: string }>

interface ClientBookingsViewProps {
  bookings?: ClientBooking[]
}

export function ClientBookingsView({ bookings = [] }: ClientBookingsViewProps) {
  const upcoming = bookings.filter((booking) => booking.status !== 'CANCELLED')
  const totalSpent = bookings
    .filter((booking) => booking.status === 'CONFIRMED')
    .reduce((sum, booking) => sum + booking.price, 0)

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-end">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-85"
          style={{ background: '#489B6E' }}
        >
          <Plus size={14} />
          Nouveau RDV
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="space-y-4 lg:col-span-1">
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
          >
            <p
              className="mb-3 text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(37,49,34,0.4)' }}
            >
              Resume
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-black" style={{ color: '#253122' }}>
                  {upcoming.length}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'rgba(37,49,34,0.45)' }}>
                  RDV a venir
                </p>
              </div>
              <div className="border-t pt-4" style={{ borderColor: 'rgba(37,49,34,0.06)' }}>
                <p className="text-3xl font-black" style={{ color: '#253122' }}>
                  {totalSpent} EUR
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'rgba(37,49,34,0.45)' }}>
                  Depense au total
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/client/history"
            className="flex items-center justify-between rounded-2xl border px-4 py-3.5 text-sm transition-colors hover:bg-black/[.02]"
            style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
          >
            <span style={{ color: 'rgba(37,49,34,0.55)' }}>Historique complet</span>
            <ChevronRight size={14} style={{ color: 'rgba(37,49,34,0.25)' }} />
          </Link>
        </aside>

        <section className="lg:col-span-3" aria-labelledby="upcoming-bookings-heading">
          {/*<h1 id="upcoming-bookings-heading" className="mb-4 text-lg font-black" style={{ color: '#253122' }}>
            A venir
          </h1>*/}
          {upcoming.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-2xl border p-16 text-center"
              style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff', minHeight: '280px' }}
            >
              <CalendarDays size={40} className="mb-4" style={{ color: 'rgba(37,49,34,0.12)' }} />
              <p className="font-semibold" style={{ color: '#253122' }}>
                Aucune reservation a venir
              </p>
              <p className="mt-1 text-sm" style={{ color: 'rgba(37,49,34,0.45)' }}>
                Prenez un RDV en quelques secondes.
              </p>
              <Link
                id="bookings-cta"
                href="/search"
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#489B6E' }}
              >
                Trouver un professionnel
              </Link>
            </div>
          ) : (
            <ol className="space-y-3" aria-label="Liste de vos reservations">
              {upcoming.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-2xl border p-5"
                  style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: '#253122' }}>
                          {booking.org}
                        </p>
                        <span
                          className="rounded-md px-2 py-0.5 text-xs font-semibold"
                          style={statusStyles[booking.status]}
                        >
                          {statusLabels[booking.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm" style={{ color: 'rgba(37,49,34,0.5)' }}>
                        {booking.service} - {booking.member}
                      </p>
                      <div
                        className="mt-2 flex items-center gap-3 text-xs"
                        style={{ color: 'rgba(37,49,34,0.45)' }}
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
                    {booking.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/[.05]"
                        style={{ color: 'rgba(37,49,34,0.3)' }}
                        aria-label={`Annuler ${booking.service}`}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
