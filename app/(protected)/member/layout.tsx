import type { ReactNode } from 'react'
import React from 'react'
import { redirect } from 'next/navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { MemberSidebar } from '@/components/dashboard/member-sidebar'
import { SiteHeader } from '@/components/site-header'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

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
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <MemberSidebar
        variant="inset"
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image ?? '',
        }}
      />
      <SidebarInset>
        <SiteHeader title="Espace professionnel" />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
