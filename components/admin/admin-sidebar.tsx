'use client'

import * as React from 'react'
import {
  CalendarCheck,
  LayoutDashboardIcon,
  UsersIcon,
  BuildingIcon,
  CalendarIcon,
  Settings2Icon,
  CircleHelpIcon,
} from 'lucide-react'
import Link from 'next/link'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navMain = [
  { title: "Vue d'ensemble", url: '/admin', icon: <LayoutDashboardIcon /> },
  { title: 'Utilisateurs', url: '/admin/users', icon: <UsersIcon /> },
  { title: 'Organisations', url: '/admin/organizations', icon: <BuildingIcon /> },
  { title: 'Réservations', url: '/admin/bookings', icon: <CalendarIcon /> },
]

const navSecondary = [
  { title: 'Paramètres', url: '/admin/settings', icon: <Settings2Icon /> },
  { title: 'Aide', url: '#', icon: <CircleHelpIcon /> },
]

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; avatar: string }
}

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/admin" className="flex items-center gap-2">
                <span
                  className="flex size-6 items-center justify-center rounded-md"
                  style={{ background: '#489B6E' }}
                >
                  <CalendarCheck size={14} className="text-white" />
                </span>
                <span className="text-base font-bold" style={{ color: '#253122' }}>
                  CutBook <span className="text-xs font-normal opacity-50">Admin</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
