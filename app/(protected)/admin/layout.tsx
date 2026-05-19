import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { SiteHeader } from '@/components/site-header'
import { getSession } from '@/lib/auth'

// ── Whitelist des super-admins ─────────────────────────────────────────────────
// Définie dans .env : ADMIN_EMAILS=samy@mail.com,adil@mail.com
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession()

  const email = session?.user?.email?.toLowerCase() ?? ''

  // Redirige vers / sans révéler que la route existe
  // (pas de 401/403 qui confirmerait l'existence du dashboard)
  if (!email || !ADMIN_EMAILS.includes(email)) {
    redirect('/')
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
      <AdminSidebar
        variant="inset"
        user={{
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          avatar: session?.user?.image ?? '',
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
