import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, MapPin, Scissors, User } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getPublicOrganizationBySlug } from '@/lib/organizations/public-organization'
import { getPublicOrgBookingHref, getPublicOrgHref } from '@/lib/routes/organization-public-route'

interface Props {
  params: Promise<{ 'org-slug': string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'org-slug': orgSlug } = await params
  // cache() partage cet appel avec le rendu de la page → une seule query DB.
  const org = await getPublicOrganizationBySlug(orgSlug)

  if (!org) {
    return { title: 'Établissement introuvable', robots: { index: false } }
  }

  const canonicalPath = getPublicOrgHref(org.slug)
  const description = org.description ?? `Réservez chez ${org.name} en ligne, en quelques clics.`

  return {
    // Le template racine ajoute « | CutBook » → « {nom} | CutBook ».
    title: org.name,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'website',
      url: canonicalPath,
      title: `${org.name} — CutBook`,
      description,
    },
  }
}

export default async function PublicOrganizationPage({ params }: Props) {
  const { 'org-slug': orgSlug } = await params
  const org = await getPublicOrganizationBySlug(orgSlug)

  if (!org) {
    notFound()
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
      <div>
        <Link
          href="/search"
          className="mb-4 inline-flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(37,49,34,0.5)' }}
        >
          <ChevronLeft size={14} />
          Tous les etablissements
        </Link>
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <section
            className="rounded-2xl border p-6"
            style={{ borderColor: 'rgba(37,49,34,0.1)', background: '#fff' }}
          >
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#253122' }}>
              {org.name}
            </h1>
            <p
              className="mt-3 flex items-center gap-1 text-sm"
              style={{ color: 'rgba(37,49,34,0.5)' }}
            >
              <MapPin size={14} />
              {org.address}
            </p>
            {org.description && (
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(37,49,34,0.6)' }}>
                {org.description}
              </p>
            )}
            <Link
              href={getPublicOrgBookingHref(org.slug)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#489B6E' }}
            >
              <CalendarDays size={16} />
              Reserver un rendez-vous
            </Link>
          </section>

          <aside
            className="rounded-2xl border p-5"
            style={{ borderColor: 'rgba(37,49,34,0.1)', background: '#fff' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: '#253122' }}>
              Professionnels
            </h2>
            <div className="mt-4 space-y-3">
              {org.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'rgba(37,49,34,0.08)' }}
                  >
                    <User size={16} style={{ color: 'rgba(37,49,34,0.4)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#253122' }}>
                      {member.user.name}
                    </p>
                    {member.specialties && (
                      <p className="text-xs" style={{ color: 'rgba(37,49,34,0.45)' }}>
                        {member.specialties}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <section aria-labelledby="services-heading">
        <h2
          id="services-heading"
          className="mb-4 text-sm font-semibold"
          style={{ color: '#253122' }}
        >
          Services disponibles
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {org.services.map((service) => (
            <div
              key={service.id}
              className="rounded-xl border p-4"
              style={{ borderColor: 'rgba(37,49,34,0.1)', background: '#fff' }}
            >
              <Scissors size={15} style={{ color: '#489B6E' }} />
              <p className="mt-3 text-sm font-semibold" style={{ color: '#253122' }}>
                {service.name}
              </p>
              {service.description && (
                <p className="mt-1 text-xs" style={{ color: 'rgba(37,49,34,0.45)' }}>
                  {service.description}
                </p>
              )}
              <p className="mt-2 text-xs font-medium" style={{ color: '#489B6E' }}>
                {service.duration} min - {service.price} EUR
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
