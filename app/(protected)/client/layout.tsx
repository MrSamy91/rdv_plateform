import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { DashboardBreadcrumb } from '@/components/dashboard/dashboard-breadcrumb'
import { ClientSidebar } from '@/components/dashboard/client-sidebar'
import { Search } from 'lucide-react'
import Link from 'next/link'

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  const name = session!.user.name
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
          /* Skeleton sidebar — visible uniquement sur desktop pendant le chargement */
          <aside
            className="hidden w-60 shrink-0 md:flex"
            style={{ background: '#253122' }}
            aria-hidden
          />
        }
      >
        <ClientSidebar />
      </Suspense>

      {/* Zone contenu — prend tout l'espace restant */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header
          className="flex h-16 shrink-0 items-center justify-between border-b pr-5 pl-16 md:px-8"
          style={{
            borderColor: 'rgba(37,49,34,0.08)',
            background: '#fff',
          }}
        >
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#253122' }}>
            Bonjour, {displayName} 👋
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              id="client-header-search"
              href="/search"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#489B6E',
                color: '#fff',
                padding: '0.45rem 0.875rem',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Search size={13} />
              <span className="hidden sm:inline">Trouver un pro</span>
              <span className="sm:hidden">Chercher</span>
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

        {/* Main */}
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
          className="p-4 sm:p-6 md:p-8 lg:p-10"
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
