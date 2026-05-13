'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const ROOT_LABELS = {
  client: 'Accueil',
  member: 'Tableau de bord',
} as const

const ROUTE_LABELS: Record<string, string> = {
  '/client': 'Accueil',
  '/client/bookings': 'Mes réservations',
  '/client/history': 'Historique',
  '/client/rewards': 'Fidélité',
  '/client/settings': 'Paramètres',
  '/member': 'Tableau de bord',
  '/member/calendar': 'Mon calendrier',
  '/member/availability': 'Mes créneaux',
  '/member/profile': 'Mon profil',
}

interface DashboardBreadcrumbProps {
  base: keyof typeof ROOT_LABELS
}

function humanizeSegment(segment: string) {
  return decodeURIComponent(segment)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function DashboardBreadcrumb({ base }: DashboardBreadcrumbProps) {
  const pathname = usePathname()
  const baseHref = `/${base}`
  const segments = pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)

  if (segments[0] !== base) {
    return null
  }

  const items = [
    { href: baseHref, label: ROOT_LABELS[base] },
    ...segments.slice(1).map((segment, index) => {
      const href = `/${segments.slice(0, index + 2).join('/')}`
      return {
        href,
        label: ROUTE_LABELS[href] ?? humanizeSegment(segment),
      }
    }),
  ]

  return (
    <nav aria-label="Fil d'ariane" className="mb-6 flex items-center gap-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={item.href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight size={14} style={{ color: 'rgba(37,49,34,0.22)' }} />}
            {isLast ? (
              <span className="font-semibold" style={{ color: '#253122' }}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="transition-opacity hover:opacity-70"
                style={{ color: 'rgba(37,49,34,0.5)' }}
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
