'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Tag,
  Store,
  User,
  ArrowLeftRight,
} from 'lucide-react'
import Link from 'next/link'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { Logo } from '@/components/brand/logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navMain = [
  { title: 'Tableau de bord', url: '/member', icon: <LayoutDashboard /> },
  { title: 'Mon calendrier', url: '/member/calendar', icon: <CalendarDays /> },
  { title: 'Mes créneaux', url: '/member/availability', icon: <Clock /> },
  { title: 'Mes services', url: '/member/services', icon: <Tag /> },
  { title: 'Mon profil', url: '/member/profile', icon: <User /> },
]

interface MemberSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; avatar: string }
  isOwner?: boolean
}

export function MemberSidebar({ user, isOwner, ...props }: MemberSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/member" className="flex items-center" style={{ color: '#253122' }}>
                <Logo variant="compose" size="sm" subtitle="Pro" priority />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />

        {/* Bascule vers la vue client (un member est aussi un client) */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {isOwner && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Espace gérant">
                    <Link href="/owner">
                      <Store />
                      <span>Espace gérant</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Vue client">
                  <Link href="/client">
                    <ArrowLeftRight />
                    <span>Espace client</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} profileHref="/member/profile" />
      </SidebarFooter>
    </Sidebar>
  )
}
