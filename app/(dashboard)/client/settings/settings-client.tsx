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
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth/client'

// ── Types ──────────────────────────────────────────────────────────────────────

type Status = { type: 'success' | 'error'; message: string } | null
type Tab = 'compte' | 'securite' | 'telephone' | 'danger'

// ── Atoms ──────────────────────────────────────────────────────────────────────

function StatusBanner({ status }: { status: Status }) {
  if (!status) return null
  const isOk = status.type === 'success'
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium',
        isOk ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
      )}
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
      <label htmlFor={id} className="text-foreground block text-sm font-medium">
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
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {suffix && (
          <div className="text-muted-foreground absolute inset-y-0 right-3 flex items-center">
            {suffix}
          </div>
        )}
      </div>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

function SaveButton({ pending, label = 'Enregistrer' }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
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
      <div className="mb-5">
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      <div className="border-border bg-card rounded-xl border p-6">{children}</div>
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
          suffix={<Mail size={15} />}
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
          <p className="text-muted-foreground text-xs">
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

  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    if (next !== confirm) {
      setStatus({ type: 'error', message: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (next.length < 8) {
      setStatus({ type: 'error', message: 'Le mot de passe doit contenir au moins 8 caractères.' })
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
          suffix={eyeBtn}
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
          suffix={<Phone size={15} />}
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
      <div className="mb-5">
        <h2 className="text-destructive text-base font-semibold">Zone dangereuse</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Ces actions sont irréversibles. Procédez avec précaution.
        </p>
      </div>

      <div className="border-destructive/20 bg-card rounded-xl border">
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-foreground text-sm font-semibold">Supprimer mon compte</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Toutes vos données — réservations, points fidélité, historique — seront définitivement
              effacées.
            </p>
          </div>
          {step === 'idle' && (
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="border-destructive/30 text-destructive hover:bg-destructive/5 shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
            >
              Supprimer
            </button>
          )}
        </div>

        {step === 'confirm' && (
          <div className="border-destructive/15 bg-destructive/5 space-y-4 border-t p-5">
            <p className="text-foreground text-sm">
              Tapez <span className="font-mono font-bold">{CONFIRM_WORD}</span> pour confirmer la
              suppression définitive :
            </p>
            <input
              id="settings-delete-confirm"
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="border-destructive/30 bg-background text-foreground placeholder:text-muted-foreground focus:border-destructive focus:ring-destructive/20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
            />
            <StatusBanner status={status} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirm !== CONFIRM_WORD || pending}
                className="bg-destructive inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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
                className="border-border text-muted-foreground hover:bg-muted rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
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

const NAV: {
  id: Tab
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}[] = [
  { id: 'compte', label: 'Compte', icon: Mail },
  { id: 'securite', label: 'Sécurité', icon: ShieldCheck },
  { id: 'telephone', label: 'Téléphone', icon: Phone },
  { id: 'danger', label: 'Zone dangereuse', icon: Trash2 },
]

// ── Export principal ──────────────────────────────────────────────────────────

interface SettingsClientProps {
  currentEmail: string
  name: string
}

export function SettingsClient({ currentEmail, name }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('compte')

  // Initiales pour l'avatar
  const initials = name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* En-tête profil */}
      <div className="mb-8 flex items-center gap-4">
        <div className="bg-sidebar text-sidebar-foreground flex size-14 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {initials}
        </div>
        <div>
          <h1 className="text-foreground text-lg font-bold">{name}</h1>
          <p className="text-muted-foreground text-sm">{currentEmail}</p>
        </div>
      </div>

      {/* Layout deux colonnes */}
      <div className="flex gap-8">
        {/* Nav latérale */}
        <nav className="w-48 shrink-0 space-y-1" aria-label="Sections des paramètres">
          {NAV.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            const isDanger = id === 'danger'
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive && !isDanger && 'bg-primary/10 text-primary',
                  isActive && isDanger && 'bg-destructive/10 text-destructive',
                  !isActive &&
                    !isDanger &&
                    'text-muted-foreground hover:bg-muted hover:text-foreground',
                  !isActive &&
                    isDanger &&
                    'text-muted-foreground hover:bg-destructive/5 hover:text-destructive',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={15} className="shrink-0" />
                  {label}
                </span>
                {isActive && <ChevronRight size={13} className="shrink-0" />}
              </button>
            )
          })}
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
