import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { DashboardBreadcrumb } from '@/components/dashboard/dashboard-breadcrumb'
import { MemberSidebar } from '@/components/dashboard/member-sidebar'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Shell partagé pour toutes les pages /member/* : /member, /member/calendar, /member/availability...
// (dashboard)/layout.tsx gère la protection session.
export default async function MemberLayout({ children }: { children: ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const member = await db.member.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!member) {
    redirect('/client')
  }

  return (
    <div className="flex" style={{ minHeight: '100svh', background: '#f9f7f3' }}>
      {/* Suspense évite l'hydration mismatch de usePathname() dans MemberSidebar */}
      <Suspense
        fallback={
          <aside
            className="flex w-64 shrink-0 flex-col"
            style={{ background: '#253122' }}
            aria-hidden
          />
        }
      >
        <MemberSidebar />
      </Suspense>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
          padding: '2rem 2.5rem',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Suspense fallback={null}>
          <DashboardBreadcrumb base="member" />
        </Suspense>
        {children}
      </main>
    </div>
  )
}
