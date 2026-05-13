import { CalendarDays, ChevronRight, Clock, Gift, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'

const quickLinks = [
  {
    href: '/client/bookings',
    label: 'Mes reservations',
    sub: 'Voir et gerer vos rendez-vous a venir',
    icon: CalendarDays,
    accent: '#489B6E',
  },
  {
    href: '/client/rewards',
    label: 'Programme fidelite',
    sub: 'Points, recompenses et avantages exclusifs',
    icon: Gift,
    accent: '#C5A56E',
  },
  {
    href: '/search',
    label: 'Trouver un professionnel',
    sub: 'Explorer les salons disponibles pres de chez vous',
    icon: Search,
    accent: '#253122',
  },
] as const

export function ClientDashboardOverview() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="next-rdv-heading">
        <h2
          id="next-rdv-heading"
          className="mb-3 text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'rgba(37,49,34,0.4)' }}
        >
          Prochain rendez-vous
        </h2>
        <div
          className="relative overflow-hidden rounded-2xl border p-6"
          style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
        >
          <div
            className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
            style={{ background: '#489B6E' }}
          />
          <div className="flex flex-wrap items-center gap-5 pl-4">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(72,155,110,0.1)' }}
            >
              <CalendarDays size={20} style={{ color: '#489B6E' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#253122' }}>
                Aucun rendez-vous a venir
              </p>
              <p className="mt-0.5 text-sm" style={{ color: 'rgba(37,49,34,0.45)' }}>
                Reservez des maintenant chez votre salon prefere
              </p>
            </div>
            <Link
              id="client-book-next"
              href="/search"
              className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85"
              style={{ background: '#489B6E' }}
            >
              Reserver
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <section aria-labelledby="stats-heading">
            <h2
              id="stats-heading"
              className="mb-3 text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(37,49,34,0.4)' }}
            >
              Mon activite
            </h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <div
                className="rounded-2xl border p-5"
                style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
              >
                <div className="flex items-center justify-between">
                  <Clock size={16} style={{ color: 'rgba(37,49,34,0.35)' }} />
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: 'rgba(37,49,34,0.06)', color: 'rgba(37,49,34,0.4)' }}
                  >
                    Total
                  </span>
                </div>
                <p className="mt-4 text-4xl font-black" style={{ color: '#253122' }}>
                  0
                </p>
                <p className="mt-1 text-xs font-medium" style={{ color: 'rgba(37,49,34,0.45)' }}>
                  RDV realises
                </p>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: 'rgba(197,165,110,0.2)',
                  background: 'rgba(197,165,110,0.05)',
                }}
              >
                <div className="flex items-center justify-between">
                  <Gift size={16} style={{ color: '#C5A56E' }} />
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: 'rgba(197,165,110,0.12)', color: '#C5A56E' }}
                  >
                    Fidelite
                  </span>
                </div>
                <p className="mt-4 text-4xl font-black" style={{ color: '#253122' }}>
                  0
                </p>
                <p className="mt-1 text-xs font-medium" style={{ color: 'rgba(37,49,34,0.45)' }}>
                  Points accumules
                </p>
              </div>
            </div>
          </section>

          <div
            className="flex items-start gap-4 rounded-2xl border p-5"
            style={{ borderColor: 'rgba(37,49,34,0.06)', background: 'rgba(37,49,34,0.02)' }}
          >
            <Sparkles size={18} style={{ color: '#C5A56E' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#253122' }}>
                Bienvenue sur CutBook !
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgba(37,49,34,0.5)' }}>
                Reservez en 3 clics et cumulez des points fidelite a chaque visite.
              </p>
              <Link
                href="/search"
                className="mt-3 inline-flex text-xs font-semibold transition-opacity hover:opacity-75"
                style={{ color: '#489B6E' }}
              >
                Explorer les salons
              </Link>
            </div>
          </div>
        </div>

        <section className="lg:col-span-2" aria-labelledby="links-heading">
          <h2
            id="links-heading"
            className="mb-3 text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(37,49,34,0.4)' }}
          >
            Acces rapide
          </h2>
          <div
            className="divide-y overflow-hidden rounded-2xl border"
            style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
          >
            {quickLinks.map(({ href, label, sub, icon: Icon, accent }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-4 px-6 py-5 transition-colors hover:bg-black/[.02]"
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${accent}12` }}
                >
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#253122' }}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: 'rgba(37,49,34,0.45)' }}>
                    {sub}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'rgba(37,49,34,0.2)' }}
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
