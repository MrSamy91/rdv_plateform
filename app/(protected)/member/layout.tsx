import type { ReactNode } from 'react'
import React from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { MemberSidebar } from '@/components/dashboard/member-sidebar'
import { SiteHeader } from '@/components/site-header'
import { requireMember } from '@/lib/auth'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  // Garde l'espace pro + recupere la fiche Member. Memoise (cache) : la page
  // appelle aussi requireMember() sans relancer la requete.
  const { session } = await requireMember()

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
