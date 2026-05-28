import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Search, Star } from 'lucide-react'
import { listPublicOrganizations } from '@/lib/organizations/public-organization'
import { getPublicOrgHref } from '@/lib/routes/organization-public-route'

export const metadata: Metadata = {
  // Pas de suffixe manuel : le template `%s | CutBook` du layout racine
  // ajoute déjà « | CutBook » → « Trouver un professionnel | CutBook ».
  title: 'Trouver un professionnel',
  description:
    'Recherchez et réservez chez votre coiffeur, barbier ou esthéticienne en quelques clics. Disponibilités en temps réel sur CutBook.',
  alternates: { canonical: '/search' },
  openGraph: {
    type: 'website',
    url: '/search',
    title: 'Trouver un professionnel — CutBook',
    description:
      'Recherchez et réservez chez votre coiffeur, barbier ou esthéticienne en quelques clics.',
  },
}

export default async function SearchPage() {
  const organizations = await listPublicOrganizations()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: '#253122' }}>
          Trouver un professionnel
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(37,49,34,0.5)' }}>
          {organizations.length} etablissement{organizations.length > 1 ? 's' : ''} disponible
          {organizations.length > 1 ? 's' : ''}
        </p>
      </div>

      <div
        className="mb-8 flex items-center gap-3 rounded-xl border px-4 py-3"
        style={{ borderColor: 'rgba(37,49,34,0.12)', background: '#fff' }}
      >
        <Search size={16} style={{ color: 'rgba(37,49,34,0.35)' }} />
        <span className="text-sm" style={{ color: 'rgba(37,49,34,0.35)' }}>
          Coiffeur, barbier, estheticienne...
        </span>
      </div>

      {organizations.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: 'rgba(37,49,34,0.1)', background: '#fff' }}
        >
          <p className="font-semibold" style={{ color: '#253122' }}>
            Aucun etablissement disponible
          </p>
          <p className="mt-1 text-sm" style={{ color: 'rgba(37,49,34,0.45)' }}>
            Les salons apparaitront ici apres leur inscription.
          </p>
        </div>
      ) : (
        <ol className="space-y-4" aria-label="Etablissements disponibles">
          {organizations.map((org) => (
            <li key={org.id}>
              <Link
                href={getPublicOrgHref(org.slug)}
                className="block rounded-2xl border p-5 transition-colors hover:bg-black/[.02]"
                style={{ borderColor: 'rgba(37,49,34,0.1)', background: '#fff' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold" style={{ color: '#253122' }}>
                      {org.name}
                    </h2>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-xs"
                      style={{ color: 'rgba(37,49,34,0.45)' }}
                    >
                      <MapPin size={11} />
                      {org.address}
                    </p>
                    {org.services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {org.services.slice(0, 4).map((service) => (
                          <span
                            key={service.id}
                            className="rounded-md px-2 py-0.5 text-xs font-medium"
                            style={{ background: 'rgba(72,155,110,0.08)', color: '#489B6E' }}
                          >
                            {service.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star size={13} style={{ color: '#C5A56E' }} fill="#C5A56E" />
                      <span className="text-sm font-semibold" style={{ color: '#253122' }}>
                        Nouveau
                      </span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: 'rgba(37,49,34,0.4)' }}>
                      {org._count.members} pro{org._count.members > 1 ? 's' : ''}
                    </p>
                    <span
                      className="mt-3 inline-block rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                      style={{ background: '#489B6E' }}
                    >
                      Voir
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
