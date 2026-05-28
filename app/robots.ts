import type { MetadataRoute } from 'next'
import { getServerAppUrl } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerAppUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Sections sans contenu indexable : tunnels d'auth + espaces connectés.
      // Le flow /[slug]/booking, lui, est exclu via un noindex posé sur son
      // layout — un wildcard milieu-de-path en robots.txt n'est pas fiable
      // d'un crawler à l'autre.
      disallow: [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/client',
        '/member',
        '/owner',
        '/admin',
        '/api/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
