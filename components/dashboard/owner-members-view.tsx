'use client'

import { useState } from 'react'
import { Check, Copy, Loader2, Mail, Trash2, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// ── Formulaire de recrutement ────────────────────────────────────────────────
function RecruitForm() {
  const utils = trpc.useUtils()
  const [email, setEmail] = useState('')

  const create = trpc.invitation.create.useMutation({
    onSuccess() {
      toast.success('Invitation envoyée')
      utils.invitation.listPending.invalidate()
      setEmail('')
    },
    onError: (e) => toast.error(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return toast.error('Email requis.')
    create.mutate({ email: trimmed })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-sm"
    >
      <div>
        <h2 className="text-foreground font-semibold">Recruter un professionnel</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Saisissez l’email d’un client de la plateforme. Il recevra un lien pour rejoindre votre
          équipe.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="recruit-email">Email du client</Label>
        <div className="flex gap-2">
          <Input
            id="recruit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
          />
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Inviter
          </Button>
        </div>
      </div>
    </form>
  )
}

// ── Bouton "copier le lien d'invitation" ─────────────────────────────────────
function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const url = `${window.location.origin}/client/become-member?token=${encodeURIComponent(token)}`
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Button size="sm" variant="ghost" onClick={copy}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Copié' : 'Copier le lien'}
    </Button>
  )
}

// ── Vue principale ───────────────────────────────────────────────────────────
export function OwnerMembersView() {
  const utils = trpc.useUtils()
  const membersQuery = trpc.organization.teamMembers.useQuery()
  const invitationsQuery = trpc.invitation.listPending.useQuery()

  // Confirmation inline du retrait d'un membre (pas de suppression directe au clic).
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const removeMember = trpc.organization.removeMember.useMutation({
    onSuccess() {
      toast.success('Professionnel retiré')
      setConfirmingId(null)
      utils.organization.teamMembers.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const revoke = trpc.invitation.revoke.useMutation({
    onSuccess() {
      toast.success('Invitation révoquée')
      utils.invitation.listPending.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const members = membersQuery.data ?? []
  const invitations = invitationsQuery.data ?? []

  return (
    <main className="flex w-full max-w-3xl flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Équipe</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gérez les professionnels de votre salon et recrutez de nouveaux membres.
        </p>
      </div>

      <RecruitForm />

      {/* Membres actuels */}
      <section className="flex flex-col gap-3">
        <h2 className="text-foreground flex items-center gap-2 font-semibold">
          <Users className="size-4" /> Professionnels ({members.length})
        </h2>
        {membersQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Chargement…
          </div>
        ) : (
          members.map((member) => (
            <article
              key={member.id}
              className="bg-card flex items-center justify-between gap-3 rounded-xl border p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-foreground flex items-center gap-2 font-semibold">
                  {member.name}
                  {member.isOwner && <Badge variant="secondary">Gérant</Badge>}
                </p>
                <p className="text-muted-foreground truncate text-sm">{member.email}</p>
              </div>
              {!member.isOwner &&
                (confirmingId === member.id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-muted-foreground hidden text-xs sm:inline">
                      Retirer ?
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={removeMember.isPending}
                      onClick={() => removeMember.mutate({ memberId: member.id })}
                    >
                      {removeMember.isPending && <Loader2 className="size-3.5 animate-spin" />}
                      Confirmer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={removeMember.isPending}
                      onClick={() => setConfirmingId(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    aria-label="Retirer le professionnel"
                    onClick={() => setConfirmingId(member.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ))}
            </article>
          ))
        )}
      </section>

      {/* Invitations en attente */}
      <section className="flex flex-col gap-3">
        <h2 className="text-foreground flex items-center gap-2 font-semibold">
          <UserPlus className="size-4" /> Invitations en attente ({invitations.length})
        </h2>
        {invitations.length === 0 ? (
          <div className="bg-muted/40 rounded-xl border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-sm">Aucune invitation en attente.</p>
          </div>
        ) : (
          invitations.map((invitation) => (
            <article
              key={invitation.id}
              className="bg-card flex items-center justify-between gap-3 rounded-xl border p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-foreground flex items-center gap-2 truncate font-medium">
                  {invitation.email}
                  {invitation.isExpired && <Badge variant="destructive">Expirée</Badge>}
                </p>
                <p className="text-muted-foreground text-xs">
                  Expire le{' '}
                  {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(
                    new Date(invitation.expiresAt),
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <CopyLinkButton token={invitation.token} />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate({ invitationId: invitation.id })}
                >
                  Révoquer
                </Button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
