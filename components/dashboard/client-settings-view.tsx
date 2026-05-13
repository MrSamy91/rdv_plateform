'use client'

import { useState, useTransition } from 'react'
import {
  Mail,
  Phone,
  Trash2,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import { trpc } from '@/lib/trpc/client'

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = { type: 'success' | 'error'; message: string } | null

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: 'rgba(37,49,34,0.08)', background: '#fff' }}
    >
      <div className="border-b px-6 py-4" style={{ borderColor: 'rgba(37,49,34,0.06)' }}>
        <h2 className="text-sm font-bold" style={{ color: '#253122' }}>
          {title}
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: 'rgba(37,49,34,0.45)' }}>
          {subtitle}
        </p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Input ──────────────────────────────────────────────────────────────────────

function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  suffix,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  suffix?: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium"
        style={{ color: 'rgba(37,49,34,0.6)' }}
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
          className="w-full rounded-xl border px-3 py-2.5 text-sm transition-colors outline-none focus:ring-1 disabled:opacity-50"
          style={{
            borderColor: 'rgba(37,49,34,0.15)',
            color: '#253122',
            background: disabled ? 'rgba(37,49,34,0.02)' : '#fff',
          }}
        />
        {suffix && <div className="absolute inset-y-0 right-3 flex items-center">{suffix}</div>}
      </div>
    </div>
  )
}

// ── Toast inline ───────────────────────────────────────────────────────────────

function Toast({ status }: { status: Status }) {
  if (!status) return null
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
      style={
        status.type === 'success'
          ? { background: 'rgba(72,155,110,0.1)', color: '#489B6E' }
          : { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }
      }
    >
      {status.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {status.message}
    </div>
  )
}

// ── Submit button ──────────────────────────────────────────────────────────────

function SubmitBtn({ pending, label = 'Enregistrer' }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
      style={{ background: '#489B6E' }}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {label}
    </button>
  )
}

// ── Email section ──────────────────────────────────────────────────────────────

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail)
  const [status, setStatus] = useState<Status>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    startTransition(async () => {
      const res = await authClient.changeEmail({ newEmail: email, callbackURL: '/client/settings' })
      if (res.error) {
        setStatus({
          type: 'error',
          message: res.error.message ?? "Erreur lors du changement d'email.",
        })
      } else {
        setStatus({ type: 'success', message: 'Un email de confirmation a été envoyé.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        id="settings-email"
        label="Nouvelle adresse email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="exemple@email.com"
        suffix={<Mail size={14} style={{ color: 'rgba(37,49,34,0.3)' }} />}
      />
      <Toast status={status} />
      <SubmitBtn pending={pending} />
    </form>
  )
}

// ── Password section ───────────────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [pending, startTransition] = useTransition()

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
        setStatus({ type: 'success', message: 'Mot de passe mis à jour avec succès.' })
        setCurrent('')
        setNext('')
        setConfirm('')
      }
    })
  }

  const toggleIcon = show ? (
    <EyeOff
      size={14}
      style={{ color: 'rgba(37,49,34,0.3)', cursor: 'pointer' }}
      onClick={() => setShow(false)}
    />
  ) : (
    <Eye
      size={14}
      style={{ color: 'rgba(37,49,34,0.3)', cursor: 'pointer' }}
      onClick={() => setShow(true)}
    />
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        id="settings-current-pw"
        label="Mot de passe actuel"
        type={show ? 'text' : 'password'}
        value={current}
        onChange={setCurrent}
        suffix={toggleIcon}
      />
      <Field
        id="settings-new-pw"
        label="Nouveau mot de passe"
        type={show ? 'text' : 'password'}
        value={next}
        onChange={setNext}
        placeholder="8 caractères minimum"
      />
      <Field
        id="settings-confirm-pw"
        label="Confirmer le nouveau mot de passe"
        type={show ? 'text' : 'password'}
        value={confirm}
        onChange={setConfirm}
      />
      <Toast status={status} />
      <SubmitBtn pending={pending} />
    </form>
  )
}

// ── Phone section ──────────────────────────────────────────────────────────────

function PhoneForm({ initialPhone }: { initialPhone: string }) {
  const utils = trpc.useUtils()
  const [phone, setPhone] = useState(initialPhone)
  const [status, setStatus] = useState<Status>(null)
  const updatePhone = trpc.clientPortal.updatePhone.useMutation({
    async onSuccess() {
      await utils.clientPortal.profile.invalidate()
      setStatus({ type: 'success', message: 'Numero enregistre.' })
    },
    onError(error) {
      setStatus({ type: 'error', message: error.message })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    updatePhone.mutate({ phone })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        id="settings-phone"
        label="Numero de telephone"
        type="tel"
        value={phone}
        onChange={setPhone}
        placeholder="+33 6 12 34 56 78"
        disabled={updatePhone.isPending}
        suffix={<Phone size={14} style={{ color: 'rgba(37,49,34,0.3)' }} />}
      />
      <Toast status={status} />
      <SubmitBtn pending={updatePhone.isPending} />
    </form>
  )
}

function PhoneSection() {
  const profile = trpc.clientPortal.profile.useQuery()

  if (profile.isLoading) {
    return <p className="text-muted-foreground text-sm">Chargement du telephone...</p>
  }

  if (profile.isError) {
    return <p className="text-destructive text-sm">Impossible de charger le telephone.</p>
  }

  const initialPhone = profile.data?.phone ?? ''

  return <PhoneForm key={initialPhone} initialPhone={initialPhone} />
}
// ── Delete account section ─────────────────────────────────────────────────────

function DeleteSection() {
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
    <div className="space-y-4">
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(220,38,38,0.15)', background: 'rgba(220,38,38,0.04)' }}
      >
        <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>
          Cette action est irréversible
        </p>
        <p className="mt-1 text-xs" style={{ color: 'rgba(37,49,34,0.55)' }}>
          Toutes vos données (réservations, points fidélité, historique) seront définitivement
          supprimées.
        </p>
      </div>

      {step === 'idle' ? (
        <button
          type="button"
          onClick={() => setStep('confirm')}
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-red-50"
          style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}
        >
          <Trash2 size={14} />
          Supprimer mon compte
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: '#253122' }}>
            Tapez <strong>{CONFIRM_WORD}</strong> pour confirmer :
          </p>
          <input
            id="settings-delete-confirm"
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#253122' }}
          />
          <Toast status={status} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirm !== CONFIRM_WORD || pending}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: '#dc2626' }}
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Confirmer la suppression
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('idle')
                setConfirm('')
              }}
              className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.02]"
              style={{ borderColor: 'rgba(37,49,34,0.12)', color: 'rgba(37,49,34,0.6)' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────────

interface SettingsClientProps {
  currentEmail: string
}

export function ClientSettingsView({ currentEmail }: SettingsClientProps) {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black" style={{ color: '#253122' }}>
          Paramètres du compte
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: 'rgba(37,49,34,0.45)' }}>
          Gérez vos informations personnelles et la sécurité de votre compte.
        </p>
      </div>

      <Section title="Adresse email" subtitle="Modifier l'email associé à votre compte.">
        <EmailSection currentEmail={currentEmail} />
      </Section>

      <Section title="Mot de passe" subtitle="Choisissez un mot de passe fort et unique.">
        <PasswordSection />
      </Section>

      <Section title="Numéro de téléphone" subtitle="Pour les rappels de rendez-vous par SMS.">
        <PhoneSection />
      </Section>

      <Section
        title="Supprimer le compte"
        subtitle="Suppression définitive de votre compte et de toutes vos données."
      >
        <DeleteSection />
      </Section>
    </div>
  )
}
