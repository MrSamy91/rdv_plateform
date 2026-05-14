'use client'

import { useState, useTransition } from 'react'
import {
  Mail,
  Phone,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { authClient } from '@/lib/auth/client'

// ── Types ──────────────────────────────────────────────────────────────────────

type Status = { type: 'success' | 'error'; message: string } | null
type Tab = 'compte' | 'securite' | 'telephone' | 'danger'

// ── Palette (aligne sur client-dashboard-overview.tsx) ────────────────────────

const C = {
  text:         '#253122',
  muted:        'rgba(37,49,34,0.45)',
  mutedLight:   'rgba(37,49,34,0.35)',
  border:       'rgba(37,49,34,0.08)',
  borderMd:     'rgba(37,49,34,0.12)',
  card:         '#fff',
  green:        '#489B6E',
  greenBg:      'rgba(72,155,110,0.1)',
  red:          '#dc2626',
  redBg:        'rgba(220,38,38,0.08)',
  redBorder:    'rgba(220,38,38,0.25)',
  dark:         '#253122',
} as const

// ── Atoms ──────────────────────────────────────────────────────────────────────

function StatusBanner({ status }: { status: Status }) {
  if (!status) return null
  const isOk = status.type === 'success'
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
      style={
        isOk
          ? { background: C.greenBg, color: C.green }
          : { background: C.redBg, color: C.red }
      }
    >
      {isOk ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {status.message}
    </div>
  )
}

function FieldInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  suffix,
  hint,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  suffix?: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium"
        style={{ color: C.muted }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors disabled:opacity-50"
          style={{
            borderColor: C.borderMd,
            color: C.text,
            background: disabled ? 'rgba(37,49,34,0.02)' : C.card,
          }}
        />
        {suffix && (
          <div
            className="absolute inset-y-0 right-3 flex items-center"
            style={{ color: C.mutedLight }}
          >
            {suffix}
          </div>
        )}
      </div>
      {hint && (
        <p className="text-xs" style={{ color: C.mutedLight }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function SaveButton({ pending, label = 'Enregistrer' }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
      style={{ background: C.green }}
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  )
}

function FormCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-bold" style={{ color: C.text }}>
          {title}
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
          {description}
        </p>
      </div>
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: C.border, background: C.card }}
      >
        <div className="h-0.5" style={{ background: C.green }} />
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Sections ──────────────────────────────────────────────────────────────────

function CompteSection({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [status, setStatus] = useState<Status>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    if (!newEmail) {
      setStatus({ type: 'error', message: 'Veuillez saisir un nouvel email.' })
      return
    }
    if (newEmail !== confirmEmail) {
      setStatus({ type: 'error', message: 'Les adresses email ne correspondent pas.' })
      return
    }
    if (newEmail === currentEmail) {
      setStatus({ type: 'error', message: "Le nouvel email est identique à l'actuel." })
      return
    }
    startTransition(async () => {
      const res = await authClient.changeEmail({ newEmail, callbackURL: '/client/settings' })
      if (res.error) {
        setStatus({
          type: 'error',
          message: res.error.message ?? "Erreur lors du changement d'email.",
        })
      } else {
        setStatus({
          type: 'success',
          message: 'Un email de confirmation a été envoyé à votre nouvelle adresse.',
        })
        setNewEmail('')
        setConfirmEmail('')
      }
    })
  }

  return (
    <FormCard
      title="Adresse email"
      description="L'adresse utilisée pour vous connecter et recevoir les confirmations de réservation."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldInput
          id="settings-current-email"
          label="Votre e-mail actuel"
          type="email"
          value={currentEmail}
          onChange={() => {}}
          disabled
          suffix={<Mail size={14} />}
        />
        <FieldInput
          id="settings-new-email"
          label="Nouvel e-mail"
          type="email"
          value={newEmail}
          onChange={setNewEmail}
          placeholder="nouveau@exemple.com"
        />
        <FieldInput
          id="settings-confirm-email"
          label="Confirmer le nouvel e-mail"
          type="email"
          value={confirmEmail}
          onChange={setConfirmEmail}
          placeholder="nouveau@exemple.com"
        />
        <StatusBanner status={status} />
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs" style={{ color: C.mutedLight }}>
            Un lien de confirmation sera envoyé à la nouvelle adresse.
          </p>
          <SaveButton pending={pending} />
        </div>
      </form>
    </FormCard>
  )
}

function SecuriteSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [pending, startTransition] = useTransition()

  const toggleIcon = show ? (
    <EyeOff
      size={14}
      style={{ cursor: 'pointer' }}
      onClick={() => setShow(false)}
    />
  ) : (
    <Eye
      size={14}
      style={{ cursor: 'pointer' }}
      onClick={() => setShow(true)}
    />
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    if (next !== confirm) {
      setStatus({ type: 'error', message: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (next.length < 8) {
      setStatus({ type: 'error', message: 'Le mot de passe doit faire au moins 8 caractères.' })
      return
    }
    startTransition(async () => {
      const res = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      })
      if (res.error) {
        setStatus({ type: 'error', message: res.error.message ?? 'Mot de passe actuel incorrect.' })
      } else {
        setStatus({
          type: 'success',
          message: 'Mot de passe mis à jour. Les autres sessions ont été déconnectées.',
        })
        setCurrent('')
        setNext('')
        setConfirm('')
      }
    })
  }

  return (
    <FormCard
      title="Mot de passe"
      description="Choisissez un mot de passe fort que vous n'utilisez nulle part ailleurs."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldInput
          id="settings-current-pw"
          label="Mot de passe actuel"
          type={show ? 'text' : 'password'}
          value={current}
          onChange={setCurrent}
          suffix={toggleIcon}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldInput
            id="settings-new-pw"
            label="Nouveau mot de passe"
            type={show ? 'text' : 'password'}
            value={next}
            onChange={setNext}
            placeholder="8 caractères minimum"
          />
          <FieldInput
            id="settings-confirm-pw"
            label="Confirmer"
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={setConfirm}
            placeholder="Répétez le mot de passe"
          />
        </div>
        <StatusBanner status={status} />
        <div className="flex justify-end pt-1">
          <SaveButton pending={pending} label="Changer le mot de passe" />
        </div>
      </form>
    </FormCard>
  )
}

function TelephoneSection() {
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    // TODO S3 : tRPC user.updatePhone({ phone })
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 600))
      setStatus({ type: 'success', message: 'Numéro enregistré (intégration tRPC en S3).' })
    })
  }

  return (
    <FormCard
      title="Numéro de téléphone"
      description="Utilisé pour les rappels de rendez-vous par SMS."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldInput
          id="settings-phone"
          label="Téléphone"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="+33 6 12 34 56 78"
          suffix={<Phone size={14} />}
          hint="Format international recommandé : +33 6 XX XX XX XX"
        />
        <StatusBanner status={status} />
        <div className="flex justify-end pt-1">
          <SaveButton pending={pending} label="Enregistrer le numéro" />
        </div>
      </form>
    </FormCard>
  )
}

function DangerSection() {
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'idle' | 'confirm'>('idle')
  const [status, setStatus] = useState<Status>(null)
  const [pending, startTransition] = useTransition()

  const CONFIRM_WORD = 'SUPPRIMER'

  function handleDelete() {
    startTransition(async () => {
      const res = await authClient.deleteUser({ callbackURL: '/login' })
      if (res.error) {
        setStatus({ type: 'error', message: res.error.message ?? 'Erreur lors de la suppression.' })
      } else {
        window.location.href = '/login'
      }
    })
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-bold" style={{ color: C.red }}>
          Zone dangereuse
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
          Ces actions sont irréversibles. Procédez avec précaution.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: C.redBorder, background: C.card }}
      >
        <div className="h-0.5" style={{ background: C.red }} />
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>
              Supprimer mon compte
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>
              Toutes vos données — réservations, points fidélité, historique — seront définitivement
              effacées.
            </p>
          </div>
          {step === 'idle' && (
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="shrink-0 rounded-xl border px-4 py-2 text-sm font-bold transition-colors hover:bg-red-50"
              style={{ borderColor: 'rgba(220,38,38,0.3)', color: C.red }}
            >
              Supprimer
            </button>
          )}
        </div>

        {step === 'confirm' && (
          <div
            className="space-y-4 border-t p-5"
            style={{
              borderColor: 'rgba(220,38,38,0.15)',
              background: 'rgba(220,38,38,0.03)',
            }}
          >
            <p className="text-sm" style={{ color: C.text }}>
              Tapez <span className="font-mono font-bold">{CONFIRM_WORD}</span> pour confirmer la
              suppression définitive :
            </p>
            <input
              id="settings-delete-confirm"
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: 'rgba(220,38,38,0.3)', color: C.text }}
            />
            <StatusBanner status={status} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirm !== CONFIRM_WORD || pending}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
                style={{ background: C.red }}
              >
                {pending && <Loader2 size={14} className="animate-spin" />}
                <Trash2 size={14} />
                Confirmer la suppression
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('idle')
                  setConfirm('')
                }}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.02]"
                style={{ borderColor: C.borderMd, color: C.muted }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Navigation latérale ───────────────────────────────────────────────────────

const NAV_MAIN: {
  id: Tab
  label: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
}[] = [
  { id: 'compte', label: 'Compte', icon: Mail },
  { id: 'securite', label: 'Sécurité', icon: ShieldCheck },
  { id: 'telephone', label: 'Téléphone', icon: Phone },
]

// ── Export principal ──────────────────────────────────────────────────────────

interface SettingsClientProps {
  currentEmail: string
  name: string
}

export function SettingsClient({ currentEmail, name }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('compte')

  const initials = name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <div className="w-full space-y-8">

      {/* En-tête profil */}
      <div
        className="flex items-center gap-4 rounded-2xl border p-5"
        style={{ borderColor: C.border, background: C.card }}
      >
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
          style={{ background: C.dark }}
        >
          {initials}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: C.text }}>
            {name}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
            {currentEmail}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: C.greenBg, color: C.green }}
        >
          Client
        </span>
      </div>

      {/* Layout deux colonnes */}
      <div className="flex gap-8">
        {/* Nav latérale */}
        <nav
          className="sticky top-6 h-fit w-44 shrink-0 overflow-hidden rounded-2xl border"
          style={{ borderColor: C.border, background: C.card }}
          aria-label="Sections des paramètres"
        >
          <div className="p-1.5 space-y-0.5">
            {NAV_MAIN.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                  style={
                    isActive
                      ? { background: C.greenBg, color: C.green }
                      : { color: C.muted }
                  }
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={14} style={{ color: isActive ? C.green : C.mutedLight }} />
                    {label}
                  </span>
                  {isActive && <ChevronRight size={12} style={{ color: C.green }} />}
                </button>
              )
            })}
          </div>

          <div className="mx-3 border-t" style={{ borderColor: C.border }} />

          <div className="p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('danger')}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={
                activeTab === 'danger'
                  ? { background: 'rgba(220,38,38,0.08)', color: C.red }
                  : { color: C.muted }
              }
              aria-current={activeTab === 'danger' ? 'page' : undefined}
            >
              <span className="flex items-center gap-2.5">
                <Trash2
                  size={14}
                  style={{ color: activeTab === 'danger' ? C.red : C.mutedLight }}
                />
                Zone dangereuse
              </span>
              {activeTab === 'danger' && <ChevronRight size={12} style={{ color: C.red }} />}
            </button>
          </div>
        </nav>

        {/* Contenu */}
        <div className="min-w-0 flex-1">
          {activeTab === 'compte' && <CompteSection currentEmail={currentEmail} />}
          {activeTab === 'securite' && <SecuriteSection />}
          {activeTab === 'telephone' && <TelephoneSection />}
          {activeTab === 'danger' && <DangerSection />}
        </div>
      </div>
    </div>
  )
}
