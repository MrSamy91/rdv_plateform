import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { DashboardBreadcrumb } from '@/components/dashboard/dashboard-breadcrumb'
import { ClientSidebar } from '@/components/dashboard/client-sidebar'
import { Search } from 'lucide-react'
import Link from 'next/link'

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const session = await requireSession('/client')

  // "Devenir membre" ne se montre qu'aux users SANS fiche Member.
  // On se base sur la relation, pas sur le role (un owner garde role CLIENT
  // tout en ayant deja une fiche Member -> il ne doit pas voir le bouton).
  const membership = await db.member.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  const name = session.user.name
  const firstName = name.split(' ')[0] ?? name
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const initials = name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <div className="flex" style={{ minHeight: '100svh', background: '#f9f7f3' }}>
      {/* Suspense évite l'hydration mismatch de usePathname() dans ClientSidebar */}
      <Suspense
        fallback={
          <aside
            className="flex w-60 shrink-0 flex-col"
            style={{ background: '#253122' }}
            aria-hidden
          />
        }
      >
        <ClientSidebar hasMembership={Boolean(membership)} />
      </Suspense>

      {/* Zone contenu — min-w-0 empêche le shrink, flex-1 prend tout l'espace restant */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            height: '4rem',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(37,49,34,0.08)',
            background: '#fff',
            padding: '0 2rem',
          }}
        >
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#253122' }}>
            Bonjour, {displayName} 👋
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              id="client-header-search"
              href="/search"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#489B6E',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Search size={14} />
              Trouver un pro
            </Link>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                flexShrink: 0,
                borderRadius: '50%',
                background: '#253122',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
              title={name}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Main — prend tout l'espace vertical restant, scroll si besoin */}
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '2rem 2.5rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Suspense fallback={null}>
            <DashboardBreadcrumb base="client" />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  )
}
