import { ChevronRight, Gift } from 'lucide-react'
import Link from 'next/link'

export function ClientRewardsView() {
  return (
    <div className="w-full space-y-6">
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: 'rgba(197,165,110,0.2)', background: 'rgba(197,165,110,0.05)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(197,165,110,0.15)' }}
          >
            <Gift size={22} style={{ color: '#C5A56E' }} />
          </div>
          <div>
            <p className="text-4xl font-black" style={{ color: '#253122' }}>
              0
            </p>
            <p className="text-sm" style={{ color: 'rgba(37,49,34,0.5)' }}>
              Points disponibles
            </p>
          </div>
        </div>
      </div>

      <section aria-labelledby="rewards-heading">
        <h2
          id="rewards-heading"
          className="mb-3 text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'rgba(37,49,34,0.4)' }}
        >
          Recompenses disponibles
        </h2>
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
        >
          <Gift size={36} className="mx-auto mb-4" style={{ color: 'rgba(37,49,34,0.12)' }} />
          <p className="font-semibold" style={{ color: '#253122' }}>
            Aucune recompense disponible
          </p>
          <p className="mt-1 text-sm" style={{ color: 'rgba(37,49,34,0.45)' }}>
            Cumulez des points a chaque reservation pour debloquer des avantages.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#489B6E' }}
          >
            Reserver maintenant
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
