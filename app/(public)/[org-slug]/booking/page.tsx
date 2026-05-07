import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PublicBookingSelector } from '@/components/booking/public-booking-selector'
import { getPublicOrganizationBySlug } from '@/lib/organizations/public-organization'
import { getPublicOrgHref } from '@/lib/routes/organization-public-route'

interface Props {
  params: Promise<{ 'org-slug': string }>
}

export const metadata: Metadata = {
  title: 'Reserver - CutBook',
}

export default async function PublicBookingPage({ params }: Props) {
  const { 'org-slug': orgSlug } = await params
  const org = await getPublicOrganizationBySlug(orgSlug)

  if (!org) {
    notFound()
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-6">
      <div>
        <Link
          href={getPublicOrgHref(org.slug)}
          className="mb-3 flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(37,49,34,0.5)' }}
        >
          <ChevronLeft size={14} />
          Retour a {org.name}
        </Link>
        <h1 className="text-xl font-black" style={{ color: '#253122' }}>
          Reserver chez {org.name}
        </h1>
      </div>

      <PublicBookingSelector orgSlug={org.slug} services={org.services} members={org.members} />
    </main>
  )
}
