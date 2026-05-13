'use client'

import { ChevronRight, Gift } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

export function ClientRewardsView() {
  const rewards = trpc.clientPortal.rewardsOverview.useQuery()
  const loyaltyPoints = rewards.data?.loyaltyPoints ?? 0
  const availableRewards = rewards.data?.availableRewards ?? []

  if (rewards.isError) {
    return (
      <div
        className="rounded-2xl border p-8 text-sm"
        style={{
          borderColor: 'rgba(220,38,38,0.18)',
          background: 'rgba(220,38,38,0.04)',
          color: '#dc2626',
        }}
      >
        Impossible de charger vos recompenses.
      </div>
    )
  }

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
              {rewards.isLoading ? '...' : loyaltyPoints}
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
          {availableRewards.length === 0 ? (
            <>
              <p className="font-semibold" style={{ color: '#253122' }}>
                Aucune recompense disponible
              </p>
              <p className="mt-1 text-sm" style={{ color: 'rgba(37,49,34,0.45)' }}>
                Cumulez des points a chaque reservation pour debloquer des avantages.
              </p>
            </>
          ) : (
            <ul className="space-y-2 text-left">
              {availableRewards.map((reward) => (
                <li
                  key={reward.id}
                  className="rounded-xl border px-4 py-3 text-sm"
                  style={{ borderColor: 'rgba(37,49,34,0.08)', color: '#253122' }}
                >
                  {reward.type}
                </li>
              ))}
            </ul>
          )}
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
