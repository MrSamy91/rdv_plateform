'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { createOrganizationSchema } from '@/lib/organizations/schema'

// ── Palette ────────────────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

// ── Atoms ──────────────────────────────────────────────────────────────────────

function FieldGroup({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold" style={{ color: C.text }}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs" style={{ color: C.muted }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium" style={{ color: C.red }}>
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  )
}

function Field({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  prefix,
  maxLength,
  disabled,
}: {
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  prefix?: string
  maxLength?: number
  disabled?: boolean
}) {
  return (
    <div
      className="flex items-center overflow-hidden rounded-xl border transition-colors focus-within:border-[#489B6E]"
      style={{ borderColor: C.borderMd, background: C.card }}
    >
      {prefix && (
        <span
          className="border-r px-3 py-2.5 text-sm select-none"
          style={{ color: C.muted, borderColor: C.border, background: 'rgba(37,49,34,0.03)' }}
        >
          {prefix}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none disabled:opacity-50"
        style={{ color: C.text }}
      />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface BecomeMemberFormProps {
  userName: string
}

export function BecomeMemberForm({ userName }: BecomeMemberFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const create = trpc.organization.create.useMutation({
    onSuccess: () => {
      router.push('/member')
      router.refresh()
    },
  })

  // Auto-génération du slug depuis le nom
  function handleNameChange(value: string) {
    setName(value)
    if (!slugEdited) {
      setSlug(toSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true)
    setSlug(toSlug(value))
  }

  function validate() {
    const result = createOrganizationSchema.safeParse({
      name,
      slug,
      address,
      phone,
      description,
    })

    if (result.success) {
      setFieldErrors({})
      return result.data
    }

    const errors: Record<string, string> = {}
    const fieldErrors = result.error.flatten().fieldErrors

    for (const [field, messages] of Object.entries(fieldErrors)) {
      const message = messages?.[0]
      if (message) {
        errors[field] = message
      }
    }

    setFieldErrors(errors)
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const values = validate()
    if (!values) return
    create.mutate(values)
  }

  const isConflict = create.error?.data?.code === 'CONFLICT'
  const isSlugConflict = isConflict && create.error?.message?.toLowerCase().includes('slug')

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center px-4 py-16"
      style={{ background: C.bg }}
    >
      {/* Header */}
      <div className="mb-10 text-center">
        <div
          className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl"
          style={{ background: C.green }}
        >
          <Building2 size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>
          Créer votre espace professionnel
        </h1>
        <p className="mt-2 text-sm" style={{ color: C.muted }}>
          Bonjour {userName} — renseignez les informations de votre organisation.
        </p>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-5 rounded-2xl border p-8"
        style={{ borderColor: C.border, background: C.card }}
        noValidate
      >
        {/* Barre accent */}
        <div className="mb-6 h-1 rounded-full" style={{ background: C.green }} />

        {/* Nom */}
        <FieldGroup id="org-name" label="Nom de l'organisation" error={fieldErrors.name}>
          <Field
            id="org-name"
            value={name}
            onChange={handleNameChange}
            placeholder="Mon Salon, Studio Lumière…"
            maxLength={50}
            disabled={create.isPending || create.isSuccess}
          />
        </FieldGroup>

        {/* Slug */}
        <FieldGroup
          id="org-slug"
          label="Identifiant URL"
          hint={`Votre page sera accessible sur /${slug || 'mon-salon'}`}
          error={fieldErrors.slug ?? (isSlugConflict ? create.error?.message : undefined)}
        >
          <Field
            id="org-slug"
            value={slug}
            onChange={handleSlugChange}
            prefix="cutbook.fr/"
            placeholder="mon-salon"
            maxLength={30}
            disabled={create.isPending || create.isSuccess}
          />
        </FieldGroup>

        {/* Adresse */}
        <FieldGroup id="org-address" label="Adresse" error={fieldErrors.address}>
          <div className="relative">
            <MapPin
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: C.muted }}
            />
            <input
              id="org-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 rue de la Paix, 75001 Paris"
              maxLength={120}
              disabled={create.isPending || create.isSuccess}
              className="w-full rounded-xl border py-2.5 pr-3 pl-8 text-sm transition-colors outline-none focus:border-[#489B6E]"
              style={{ borderColor: C.borderMd, color: C.text, background: C.card }}
            />
          </div>
        </FieldGroup>

        {/* Téléphone */}
        <FieldGroup id="org-phone" label="Téléphone" error={fieldErrors.phone}>
          <div className="relative">
            <Phone
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: C.muted }}
            />
            <input
              id="org-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              maxLength={20}
              disabled={create.isPending || create.isSuccess}
              className="w-full rounded-xl border py-2.5 pr-3 pl-8 text-sm transition-colors outline-none focus:border-[#489B6E]"
              style={{ borderColor: C.borderMd, color: C.text, background: C.card }}
            />
          </div>
        </FieldGroup>

        {/* Description (optionnel) */}
        <FieldGroup
          id="org-description"
          label="Description"
          hint="Facultatif — décrivez votre activité en quelques mots."
        >
          <div className="relative">
            <FileText
              size={14}
              className="pointer-events-none absolute top-3 left-3"
              style={{ color: C.muted }}
            />
            <textarea
              id="org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Salon de coiffure spécialisé en colorations végétales…"
              rows={3}
              maxLength={300}
              disabled={create.isPending || create.isSuccess}
              className="w-full resize-none rounded-xl border py-2.5 pr-3 pl-8 text-sm transition-colors outline-none focus:border-[#489B6E]"
              style={{ borderColor: C.borderMd, color: C.text, background: C.card }}
            />
          </div>
        </FieldGroup>

        {/* Erreur générique */}
        {create.isError && !isSlugConflict && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: C.redBg, color: C.red }}
          >
            <AlertCircle size={15} />
            {create.error.message}
          </div>
        )}

        {/* Succès */}
        {create.isSuccess && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: C.greenBg, color: C.greenDark }}
          >
            <CheckCircle2 size={15} />
            Organisation créée ! Redirection…
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={create.isPending || create.isSuccess}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: C.green }}
        >
          {create.isPending && <Loader2 size={15} className="animate-spin" />}
          {create.isPending ? 'Création en cours…' : 'Créer mon espace professionnel'}
        </button>
      </form>
    </div>
  )
}
