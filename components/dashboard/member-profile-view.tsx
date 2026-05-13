'use client'

import { useState } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc/client'
import type { AppRouter } from '@/lib/trpc/routers'

export function MemberProfileView() {
  const profile = trpc.memberPortal.profile.useQuery()

  if (profile.isLoading) {
    return (
      <div className="bg-card text-muted-foreground rounded-xl border p-8 text-sm">
        Chargement du profil...
      </div>
    )
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border p-8 text-sm">
        Impossible de charger votre profil professionnel.
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
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Mon profil</h1>
      <form
        className="bg-card max-w-3xl space-y-6 rounded-xl border p-6"
        onSubmit={(event) => {
          event.preventDefault()
          updateProfile.mutate({
            bio,
            specialties,
            experience: Number(experience),
          })
        }}
      >
        <section aria-labelledby="member-identity-heading">
          <h2 id="member-identity-heading" className="font-semibold">
            Identite
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <Label>Telephone</Label>
              <Input value={profile.phone ?? 'Non renseigne'} disabled />
            </div>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="member-profile-edit-heading">
          <h2 id="member-profile-edit-heading" className="font-semibold">
            Informations professionnelles
          </h2>
          <div className="space-y-2">
            <Label htmlFor="member-specialties">Specialites</Label>
            <Input
              id="member-specialties"
              value={specialties}
              maxLength={160}
              onChange={(event) => setSpecialties(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-experience">Experience</Label>
            <Input
              id="member-experience"
              type="number"
              min={0}
              max={80}
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-bio">Bio</Label>
            <textarea
              id="member-bio"
              value={bio}
              maxLength={500}
              onChange={(event) => setBio(event.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-32 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          {updateProfile.isSuccess && (
            <p className="text-primary text-sm">Profil professionnel mis a jour.</p>
          )}
          {updateProfile.isError && (
            <p className="text-destructive text-sm">Impossible de mettre a jour le profil.</p>
          )}
        </div>
      </form>
    </div>
  )
}
