'use client'

import { trpc } from '@/lib/trpc/client'
import type { getPublicBookingSlots } from '@/lib/organizations/public-organization'
import { PublicSlotPicker } from './public-slot-picker'

// Type des données partagé avec la source serveur (import type -> aucun code serveur bundlé).
type PublicBookingSlots = Awaited<ReturnType<typeof getPublicBookingSlots>>

interface PublicSlotPickerLiveProps {
  orgSlug: string
  serviceId?: string
  memberId?: string
  initialData: PublicBookingSlots
}

/**
 * Wrapper client : alimente le PublicSlotPicker (présentationnel) via une query tRPC cachée.
 *
 * - `initialData` : rendu SSR instantané (SEO + zéro flash de chargement).
 * - `refetchOnWindowFocus` + `refetchInterval` : c'est le SEUL moyen pour qu'un client voie
 *   les disponibilités mises à jour par le pro. L'invalidation TanStack Query ne traverse pas
 *   les sessions/navigateurs — le client doit re-lire la BDD (focus ou polling léger).
 */
export function PublicSlotPickerLive({
  orgSlug,
  serviceId,
  memberId,
  initialData,
}: PublicSlotPickerLiveProps) {
  const { data } = trpc.booking.publicSlots.useQuery(
    { orgSlug, serviceId, memberId },
    {
      initialData,
      // staleTime 0 : override du défaut global (60s) pour que CHAQUE retour sur l'onglet
      // (focus) déclenche un refetch -> le client voit aussitôt les dispos ajoutées par le pro.
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchInterval: 10_000, // filet : poll toutes les 10s tant que l'onglet est actif
    },
  )

  return (
    <PublicSlotPicker
      orgSlug={orgSlug}
      serviceId={serviceId}
      memberId={memberId}
      dates={data.dates}
      slots={data.slots}
    />
  )
}
