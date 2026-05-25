import type { ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { SiteHeader } from '@/components/site-header'
import { requireAdmin } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin()

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
          name: user.name,
          email: user.email,
          avatar: user.image ?? '',
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
