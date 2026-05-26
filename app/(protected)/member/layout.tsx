import type { ReactNode } from 'react'
import React from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { MemberSidebar } from '@/components/dashboard/member-sidebar'
import { SiteHeader } from '@/components/site-header'
import { requireMember } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  // Garde l'espace pro + recupere la fiche Member. Memoise (cache) : la page
  // appelle aussi requireMember() sans relancer la requete.
  const { session } = await requireMember()

  // Un member peut aussi etre proprietaire d'un salon -> on affiche alors le
  // lien "Espace gerant". Etre owner = posseder une Organization (ownerId).
  const ownedOrg = await db.organization.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  })

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
        isOwner={Boolean(ownedOrg)}
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
