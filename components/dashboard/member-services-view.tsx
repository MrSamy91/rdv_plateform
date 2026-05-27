'use client'

import { Scissors, Clock, Euro, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { formatPrice } from '@/lib/utils/format-price'
import { formatDuration } from '@/lib/utils/format-duration'

// ── Palette (identique au reste du dashboard membre) ─────────────────────────
const C = {
  text: '#253122',
  muted: 'rgba(37,49,34,0.45)',
  border: 'rgba(37,49,34,0.10)',
  card: '#ffffff',
  green: '#489B6E',
  greenBg: 'rgba(72,155,110,0.10)',
}

// ── ServiceCard (lecture seule) ─────────────────────────────────────────────
// Le membre consulte ses services ; il ne peut ni les modifier ni les supprimer.
// La gestion du catalogue reste au owner de l'organisation.
function ServiceCard({
  service,
}: {
  service: { id: string; name: string; description: string | null; duration: number; price: number }
}) {
  return (
    <article
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '0.875rem',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* Icône */}
      <span
        style={{
          flexShrink: 0,
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.625rem',
          background: C.greenBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Scissors size={16} color={C.green} className="rotate-90" />
      </span>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: C.text, margin: 0 }}>
          {service.name}
        </p>
        {service.description && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: C.muted,
              margin: '0.125rem 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {service.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.375rem' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.8125rem',
              color: C.muted,
            }}
          >
            <Clock size={12} />
            {formatDuration(service.duration)}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: C.green,
            }}
          >
            <Euro size={12} />
            {formatPrice(service.price)}
          </span>
        </div>
      </div>
    </article>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export function MemberServicesView() {
  const { data: services, isLoading } = trpc.memberPortal.services.useQuery()

  return (
    <div
      style={{
        padding: '2rem 2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        maxWidth: '800px',
      }}
    >
      {/* En-tête */}
      <div>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: C.text, margin: 0 }}>
          Mes services
        </h1>
        <p style={{ margin: '0.375rem 0 0', fontSize: '0.9375rem', color: C.muted }}>
          Les services que vous proposez à vos clients. Le catalogue est géré par le gérant de votre
          établissement.
        </p>
      </div>

      {/* Liste des services assignés */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.muted }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: '0.9375rem' }}>Chargement…</span>
          </div>
        )}

        {!isLoading && services && services.length === 0 && (
          <div
            style={{
              background: C.greenBg,
              border: `1px dashed ${C.green}`,
              borderRadius: '0.875rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <Scissors
              size={32}
              color={C.green}
              style={{ margin: '0 auto 0.75rem' }}
              className="rotate-90"
            />
            <p style={{ fontWeight: 700, color: C.text, margin: '0 0 0.25rem' }}>
              Aucun service ne vous est assigné
            </p>
            <p style={{ fontSize: '0.875rem', color: C.muted, margin: 0 }}>
              Demandez au gérant de votre établissement de vous attribuer des services pour
              apparaître dans les réservations.
            </p>
          </div>
        )}

        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </section>
    </div>
  )
}
