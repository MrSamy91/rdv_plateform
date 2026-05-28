import type { MetadataRoute } from 'next'
import { getServerAppUrl } from '@/lib/env'
import { listPublicOrganizationsForSitemap } from '@/lib/organizations/public-organization'

// `sitemap.ts` est mis en cache par Next.js par défaut. On le revalide toutes
// les heures (ISR) pour refléter les nouveaux établissements sans redéployer.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getServerAppUrl()
  const now = new Date()

  // Pages publiques fixes. La landing prime (1.0), la recherche change souvent
  // (nouveaux salons → daily).
  // NB: pas de tunnel booking ici (noindex) ni de pages auth/connectées.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ]

  // try/catch : le build CI tourne sans DATABASE_URL. Sans ce garde-fou la
  // génération ISR initiale planterait le build. En prod, la revalidation
  // horaire injecte les établissements dès que la DB répond.
  let orgRoutes: MetadataRoute.Sitemap = []
  try {
    const organizations = await listPublicOrganizationsForSitemap()
    orgRoutes = organizations.map((org) => ({
      url: `${baseUrl}/${org.slug}`,
      lastModified: org.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    orgRoutes = []
  }

  return [...staticRoutes, ...orgRoutes]
}
