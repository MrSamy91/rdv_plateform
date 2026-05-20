'use client'

import { useState } from 'react'
import { Scissors, Trash2, Plus, Clock, Euro, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

// ── Palette (identique au reste du dashboard membre) ─────────────────────────
const C = {
  text: '#253122',
  muted: 'rgba(37,49,34,0.45)',
  border: 'rgba(37,49,34,0.10)',
  borderMd: 'rgba(37,49,34,0.18)',
  card: '#ffffff',
  bg: '#f9f7f3',
  green: '#489B6E',
  greenBg: 'rgba(72,155,110,0.10)',
  greenDark: '#2d6b4a',
  red: '#dc2626',
  redBg: 'rgba(220,38,38,0.08)',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

// ── ServiceCard ───────────────────────────────────────────────────────────────
function ServiceCard({
  service,
  onDelete,
  isDeleting,
}: {
  service: { id: string; name: string; description: string | null; duration: number; price: number }
  onDelete: (id: string) => void
  isDeleting: boolean
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

      {/* Supprimer */}
      <button
        onClick={() => onDelete(service.id)}
        disabled={isDeleting}
        aria-label={`Supprimer ${service.name}`}
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: `1px solid ${C.border}`,
          borderRadius: '0.5rem',
          padding: '0.5rem',
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          opacity: isDeleting ? 0.5 : 1,
          color: C.red,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isDeleting) e.currentTarget.style.background = C.redBg
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <Trash2 size={15} />
      </button>
    </article>
  )
}

// ── AddServiceForm ────────────────────────────────────────────────────────────
function AddServiceForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  const createService = trpc.memberPortal.createService.useMutation({
    onSuccess() {
      setName('')
      setDescription('')
      setDuration('')
      setPrice('')
      setError('')
      onSuccess()
    },
    onError(e) {
      setError(e.message)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const durationNum = parseInt(duration, 10)
    const priceNum = parseFloat(price.replace(',', '.'))

    if (!name.trim()) {
      setError('Le nom du service est requis.')
      return
    }
    if (isNaN(durationNum) || durationNum < 5) {
      setError('Durée invalide (min 5 min).')
      return
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Prix invalide.')
      return
    }

    createService.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      duration: durationNum,
      price: priceNum,
    })
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: `1px solid ${C.borderMd}`,
    borderRadius: '0.625rem',
    fontSize: '0.9375rem',
    color: C.text,
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Nom */}
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text }}>
          Nom du service <span style={{ color: C.red }}>*</span>
        </label>
        <input
          id="service-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Coupe femme, Soin visage…"
          style={fieldStyle}
          maxLength={60}
        />
      </div>

      {/* Description */}
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text }}>
          Description <span style={{ fontSize: '0.75rem', color: C.muted }}>(optionnel)</span>
        </label>
        <input
          id="service-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Courte description du service…"
          style={fieldStyle}
          maxLength={200}
        />
      </div>

      {/* Durée + Prix en ligne */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text }}>
            Durée (minutes) <span style={{ color: C.red }}>*</span>
          </label>
          <input
            id="service-duration"
            type="number"
            min={5}
            max={480}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
            style={fieldStyle}
          />
        </div>
        <div style={{ display: 'grid', gap: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text }}>
            Prix (€) <span style={{ color: C.red }}>*</span>
          </label>
          <input
            id="service-price"
            type="number"
            min={0}
            max={9999}
            step={0.5}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="25"
            style={fieldStyle}
          />
        </div>
      </div>

      {error && <p style={{ fontSize: '0.8125rem', color: C.red, margin: 0 }}>{error}</p>}

      <button
        id="add-service-btn"
        type="submit"
        disabled={createService.isPending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          background: createService.isPending ? C.muted : C.green,
          color: '#fff',
          border: 'none',
          borderRadius: '0.625rem',
          padding: '0.75rem 1.5rem',
          fontWeight: 700,
          fontSize: '0.9375rem',
          cursor: createService.isPending ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
          alignSelf: 'flex-start',
        }}
      >
        {createService.isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Plus size={16} />
        )}
        Ajouter le service
      </button>
    </form>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export function MemberServicesView() {
  const utils = trpc.useUtils()
  const { data: services, isLoading } = trpc.memberPortal.services.useQuery()

  const deleteService = trpc.memberPortal.deleteService.useMutation({
    onSuccess() {
      utils.memberPortal.services.invalidate()
    },
  })

  function handleDelete(id: string) {
    if (confirm('Supprimer ce service ?')) {
      deleteService.mutate({ serviceId: id })
    }
  }

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
          Gérez les services proposés à vos clients. Ils apparaîtront sur votre page de réservation.
        </p>
      </div>

      {/* Liste des services existants */}
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
              Aucun service pour l&apos;instant
            </p>
            <p style={{ fontSize: '0.875rem', color: C.muted, margin: 0 }}>
              Ajoutez votre premier service ci-dessous pour apparaître dans les réservations.
            </p>
          </div>
        )}

        {services?.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onDelete={handleDelete}
            isDeleting={
              deleteService.isPending && deleteService.variables?.serviceId === service.id
            }
          />
        ))}
      </section>

      {/* Formulaire d'ajout */}
      <section
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '0.875rem',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, margin: '0 0 1.25rem' }}>
          Ajouter un service
        </h2>
        <AddServiceForm onSuccess={() => utils.memberPortal.services.invalidate()} />
      </section>
    </div>
  )
}
