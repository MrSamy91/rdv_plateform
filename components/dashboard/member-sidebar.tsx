'use client'

import * as React from 'react'
import { LayoutDashboard, CalendarDays, Clock, User, Settings2Icon, Scissors } from 'lucide-react'
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
  { title: 'Tableau de bord', url: '/member', icon: <LayoutDashboard /> },
  { title: 'Mon calendrier', url: '/member/calendar', icon: <CalendarDays /> },
  { title: 'Mes créneaux', url: '/member/availability', icon: <Clock /> },
  { title: 'Mon profil', url: '/member/profile', icon: <User /> },
]

const navSecondary = [{ title: 'Paramètres', url: '/member/profile', icon: <Settings2Icon /> }]

interface MemberSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; avatar: string }
}

export function MemberSidebar({ user, ...props }: MemberSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/member" className="flex items-center gap-2">
                <span
                  className="flex size-6 items-center justify-center rounded-md"
                  style={{ background: '#489B6E' }}
                >
                  <Scissors size={13} className="rotate-90 text-white" />
                </span>
                <span className="text-base font-bold" style={{ color: '#253122' }}>
                  CutBook <span className="text-xs font-normal opacity-50">Pro</span>
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
