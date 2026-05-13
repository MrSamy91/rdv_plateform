import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PublicSlotPicker } from '@/components/booking/public-slot-picker'
import { getPublicOrgBookingHref } from '@/lib/routes/organization-public-route'
import {
  listPublicOrganizationAvailableSlots,
  listPublicSlotDates,
} from '@/lib/organizations/public-organization'

interface Props {
  params: Promise<{ 'org-slug': string }>
  searchParams: Promise<{ service?: string; member?: string }>
}

export const metadata: Metadata = {
  title: 'Choisir un creneau - CutBook',
}

export default async function PublicBookingSlotPage({ params, searchParams }: Props) {
  const { 'org-slug': orgSlug } = await params
  const { service, member } = await searchParams
  const slots = await listPublicOrganizationAvailableSlots(orgSlug, { memberId: member })
  const slotDates = listPublicSlotDates(slots)
  const publicSlots = slots.map((slot) => ({
    id: slot.id,
    dateKey: slot.date.toISOString().slice(0, 10),
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.isAvailable,
    memberName: slot.member.user.name,
  }))

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-6">
      <div>
        <Link
          href={getPublicOrgBookingHref(orgSlug)}
          className="mb-3 flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(37,49,34,0.5)' }}
        >
          <ChevronLeft size={14} />
          Retour au choix
        </Link>
        <h1 className="text-xl font-black" style={{ color: '#253122' }}>
          Choisir un creneau
        </h1>
      </div>

      <PublicSlotPicker
        orgSlug={orgSlug}
        serviceId={service}
        memberId={member}
        dates={slotDates}
        slots={publicSlots}
      />
    </main>
  )
}
