'use client'

import * as React from 'react'
import { LayoutDashboard, Tag, Users, ArrowLeftRight, UserRound } from 'lucide-react'
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
  { title: 'Tableau de bord', url: '/owner', icon: <LayoutDashboard /> },
  { title: 'Services', url: '/owner/services', icon: <Tag /> },
  { title: 'Équipe', url: '/owner/members', icon: <Users /> },
]

interface OwnerSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; avatar: string }
}

export function OwnerSidebar({ user, ...props }: OwnerSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/owner" className="flex items-center" style={{ color: '#253122' }}>
                <Logo variant="compose" size="sm" subtitle="Gérant" priority />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />

        {/* Bascule vers les autres espaces (un gérant est aussi pro et client) */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Espace professionnel">
                  <Link href="/member">
                    <UserRound />
                    <span>Espace pro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
