'use client'

import { useState } from 'react'
import { Clock, Euro, Loader2, Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

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

// ── Types (alignés sur les selects de serviceRouter) ─────────────────────────
interface OrgMember {
  id: string
  user: { name: string; image: string | null }
}

interface ServiceItem {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  members: { memberId: string }[]
}

// ── Formulaire création / édition ───────────────────────────────────────────
interface ServiceFormValues {
  name: string
  description: string
  duration: string
  price: string
}

function ServiceForm({
  initial,
  pending,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ServiceFormValues>
  pending: boolean
  submitLabel: string
  onSubmit: (values: {
    name: string
    description?: string
    duration: number
    price: number
  }) => void
  onCancel?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [duration, setDuration] = useState(initial?.duration ?? '')
  const [price, setPrice] = useState(initial?.price ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const durationNum = parseInt(duration, 10)
    const priceNum = parseFloat(price.replace(',', '.'))

    if (name.trim().length < 2) return toast.error('Le nom doit faire au moins 2 caractères.')
    if (isNaN(durationNum) || durationNum < 5) return toast.error('Durée invalide (min 5 min).')
    if (isNaN(priceNum) || priceNum < 0) return toast.error('Prix invalide.')

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      duration: durationNum,
      price: priceNum,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="svc-name">
          Nom du service <span className="text-destructive">*</span>
        </Label>
        <Input
          id="svc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Coupe femme, Soin visage…"
          maxLength={80}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="svc-desc">
          Description <span className="text-muted-foreground text-xs">(optionnel)</span>
        </Label>
        <Input
          id="svc-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Courte description…"
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="svc-duration">
            Durée (min) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="svc-duration"
            type="number"
            min={5}
            max={480}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="svc-price">
            Prix (€) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="svc-price"
            type="number"
            min={0}
            max={10000}
            step={0.5}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="25"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  )
}

// ── Panneau d'assignation des pros à un service ──────────────────────────────
function AssignPanel({
  service,
  members,
  onClose,
}: {
  service: ServiceItem
  members: OrgMember[]
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(service.members.map((m) => m.memberId)),
  )

  const setServiceMembers = trpc.service.setServiceMembers.useMutation({
    onSuccess() {
      toast.success('Professionnels mis à jour')
      utils.service.listByOrganization.invalidate()
      onClose()
    },
    onError(e) {
      toast.error(e.message)
    },
  })

  function toggle(memberId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(memberId)
      else next.delete(memberId)
      return next
    })
  }

  return (
    <div className="bg-muted/40 mt-3 rounded-lg border p-4">
      <p className="text-foreground mb-3 text-sm font-medium">Qui propose « {service.name} » ?</p>

      {members.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun professionnel dans le salon.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.map((member) => (
            <label key={member.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={selected.has(member.id)}
                onCheckedChange={(c) => toggle(member.id, c === true)}
              />
              <span className="text-foreground">{member.user.name}</span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          disabled={setServiceMembers.isPending}
          onClick={() =>
            setServiceMembers.mutate({ serviceId: service.id, memberIds: [...selected] })
          }
        >
          {setServiceMembers.isPending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={setServiceMembers.isPending}>
          Annuler
        </Button>
      </div>
    </div>
  )
}

// ── Carte d'un service (affichage + édition + assignation) ───────────────────
function ServiceRow({ service, members }: { service: ServiceItem; members: OrgMember[] }) {
  const utils = trpc.useUtils()
  const [mode, setMode] = useState<'view' | 'edit' | 'assign'>('view')

  const assignedNames = members
    .filter((m) => service.members.some((sm) => sm.memberId === m.id))
    .map((m) => m.user.name)

  const update = trpc.service.update.useMutation({
    onSuccess() {
      toast.success('Service mis à jour')
      utils.service.listByOrganization.invalidate()
      setMode('view')
    },
    onError: (e) => toast.error(e.message),
  })

  const remove = trpc.service.delete.useMutation({
    onSuccess() {
      toast.success('Service supprimé')
      utils.service.listByOrganization.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <article className="bg-card rounded-xl border p-4 shadow-sm">
      {mode === 'edit' ? (
        <ServiceForm
          initial={{
            name: service.name,
            description: service.description ?? '',
            duration: String(service.duration),
            price: String(service.price),
          }}
          pending={update.isPending}
          submitLabel="Enregistrer"
          onSubmit={(values) => update.mutate({ serviceId: service.id, ...values })}
          onCancel={() => setMode('view')}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-foreground font-semibold">{service.name}</p>
              {service.description && (
                <p className="text-muted-foreground mt-0.5 truncate text-sm">
                  {service.description}
                </p>
              )}
              <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatDuration(service.duration)}
                </span>
                <span className="text-primary flex items-center gap-1 font-medium">
                  <Euro className="size-3.5" />
                  {formatPrice(service.price)}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Assigner des professionnels"
                onClick={() => setMode(mode === 'assign' ? 'view' : 'assign')}
              >
                <Users className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Modifier le service"
                onClick={() => setMode('edit')}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                aria-label="Supprimer le service"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ serviceId: service.id })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {/* Pros assignés */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {assignedNames.length === 0 ? (
              <span className="text-muted-foreground text-xs">Aucun pro assigné</span>
            ) : (
              assignedNames.map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))
            )}
          </div>

          {mode === 'assign' && (
            <AssignPanel service={service} members={members} onClose={() => setMode('view')} />
          )}
        </>
      )}
    </article>
  )
}

// ── Vue principale ───────────────────────────────────────────────────────────
export function OwnerServicesView({ orgId }: { orgId: string }) {
  const utils = trpc.useUtils()
  const [showCreate, setShowCreate] = useState(false)

  const servicesQuery = trpc.service.listByOrganization.useQuery({ orgId })
  const membersQuery = trpc.service.listOrgMembers.useQuery({ orgId })

  const create = trpc.service.create.useMutation({
    onSuccess() {
      toast.success('Service créé')
      utils.service.listByOrganization.invalidate()
      setShowCreate(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const services = servicesQuery.data ?? []
  const members = membersQuery.data ?? []

  return (
    <main className="flex w-full max-w-3xl flex-col gap-6 p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérez le catalogue du salon et choisissez quels professionnels proposent chaque service.
          </p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)} variant={showCreate ? 'ghost' : 'default'}>
          {showCreate ? <X className="size-4" /> : <Plus className="size-4" />}
          {showCreate ? 'Fermer' : 'Nouveau service'}
        </Button>
      </div>

      {showCreate && (
        <section className="bg-card rounded-xl border p-5 shadow-sm">
          <h2 className="text-foreground mb-4 font-semibold">Nouveau service</h2>
          <ServiceForm
            pending={create.isPending}
            submitLabel="Créer le service"
            onSubmit={(values) => create.mutate({ orgId, ...values })}
            onCancel={() => setShowCreate(false)}
          />
        </section>
      )}

      <section className="flex flex-col gap-3">
        {servicesQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Chargement…
          </div>
        ) : services.length === 0 ? (
          <div className="bg-muted/40 rounded-xl border border-dashed p-8 text-center">
            <p className="text-foreground font-semibold">Aucun service pour l&apos;instant</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Créez votre premier service pour qu&apos;il apparaisse dans les réservations.
            </p>
          </div>
        ) : (
          services.map((service) => (
            <ServiceRow key={service.id} service={service} members={members} />
          ))
        )}
      </section>
    </main>
  )
}
