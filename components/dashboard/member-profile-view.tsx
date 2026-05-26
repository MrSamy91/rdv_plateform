'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, User, Briefcase } from 'lucide-react'
import type { inferRouterOutputs } from '@trpc/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/client'
import type { AppRouter } from '@/lib/trpc/routers'

export function MemberProfileView() {
  const profile = trpc.memberPortal.profile.useQuery()

  if (profile.isLoading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full max-w-3xl rounded-xl" />
      </div>
    )
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="text-destructive pt-6 text-sm">
            Impossible de charger votre profil professionnel.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <MemberProfileForm
      key={`${profile.data.bio ?? ''}-${profile.data.specialties ?? ''}-${profile.data.experience}`}
      profile={profile.data}
    />
  )
}

type MemberProfile = inferRouterOutputs<AppRouter>['memberPortal']['profile']

function MemberProfileForm({ profile }: { profile: MemberProfile }) {
  const utils = trpc.useUtils()
  const [bio, setBio] = useState(profile.bio ?? '')
  const [specialties, setSpecialties] = useState(profile.specialties ?? '')
  const [experience, setExperience] = useState(String(profile.experience))

  const updateProfile = trpc.memberPortal.updateProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.memberPortal.profile.invalidate(),
        utils.memberPortal.dashboardSummary.invalidate(),
      ])
    },
  })

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Titre */}
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#253122' }}>
          Mon profil
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gérez vos informations personnelles et professionnelles.
        </p>
      </div>

      <form
        className="flex flex-col gap-6 px-4 lg:px-6"
        onSubmit={(e) => {
          e.preventDefault()
          updateProfile.mutate({ bio, specialties, experience: Number(experience) })
        }}
      >
        {/* Identité (readonly) */}
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#489B6E]/10">
                <User size={16} className="text-[#489B6E]" />
              </div>
              <div>
                <CardTitle>Identité</CardTitle>
                <CardDescription>Informations synchronisées avec votre compte.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={profile.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Organisation</Label>
                <Input value={profile.organizationName} disabled />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={profile.phone ?? 'Non renseigné'} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Infos pro (éditable) */}
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#489B6E]/10">
                <Briefcase size={16} className="text-[#489B6E]" />
              </div>
              <div>
                <CardTitle>Informations professionnelles</CardTitle>
                <CardDescription>Visibles par les clients sur votre profil public.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-specialties">Spécialités</Label>
              <Input
                id="member-specialties"
                value={specialties}
                maxLength={160}
                placeholder="Coupe, coloration, balayage…"
                onChange={(e) => setSpecialties(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-experience">Années d&apos;expérience</Label>
              <Input
                id="member-experience"
                type="number"
                min={0}
                max={80}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="max-w-[140px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-bio">Bio</Label>
              <textarea
                id="member-bio"
                value={bio}
                maxLength={500}
                placeholder="Décrivez-vous en quelques mots…"
                onChange={(e) => setBio(e.target.value)}
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <p className="text-muted-foreground text-xs">{bio.length} / 500 caractères</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex max-w-3xl items-center gap-3 pb-4">
          <Button
            type="submit"
            disabled={updateProfile.isPending}
            style={{ background: '#489B6E' }}
            className="text-white hover:opacity-90"
          >
            {updateProfile.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                Enregistrement…
              </span>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>

          {updateProfile.isSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-[#489B6E]">
              <CheckCircle2 size={15} />
              Profil mis à jour
            </span>
          )}
          {updateProfile.isError && (
            <span className="text-destructive flex items-center gap-1.5 text-sm">
              <AlertCircle size={15} />
              Impossible de mettre à jour
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
