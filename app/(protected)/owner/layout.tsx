import type { ReactNode } from 'react'
import React from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { OwnerSidebar } from '@/components/dashboard/owner-sidebar'
import { SiteHeader } from '@/components/site-header'
import { requireOwner } from '@/lib/auth'

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  // Garde l'espace gérant : exige d'être propriétaire d'une orga (Organization.ownerId).
  // Mémoïsé (cache) : la page peut rappeler requireOwner() sans relancer la requête.
  const { session } = await requireOwner()

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <OwnerSidebar
        variant="inset"
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image ?? '',
        }}
      />
      <SidebarInset>
        <SiteHeader title="Espace gérant" />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
