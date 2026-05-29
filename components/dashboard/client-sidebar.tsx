'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeftRight,
  CalendarDays,
  EllipsisVertical,
  Gift,
  History,
  Home,
  LogOut,
  Settings,
  User,
  UserRoundPlus,
} from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth/client'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

const navItems = [
  { href: '/client', label: 'Accueil', icon: Home, exact: true },
  { href: '/client/bookings', label: 'Mes RDV', icon: CalendarDays, exact: false },
  { href: '/client/history', label: 'Historique', icon: History, exact: false },
  { href: '/client/rewards', label: 'Fidélité', icon: Gift, exact: false },
  { href: '/client/settings', label: 'Paramètres', icon: Settings, exact: false },
] as const

export function ClientSidebar({
  hasMembership,
  user,
}: {
  hasMembership: boolean
  user: { name: string; email: string; avatar?: string }
}) {
  const pathname = usePathname()

  return (
    <aside
      className="flex w-60 shrink-0 flex-col"
      style={{ background: '#253122' }}
      aria-label="Navigation client"
    >
      {/* Brand — fond sombre, texte blanc herite via text-white */}
      <div
        className="flex h-16 items-center border-b px-5 text-white"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <Logo variant="compose" size="sm" priority />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Navigation client">
        <p
          className="mb-2 px-3 text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive ? 'text-white' : 'text-white/50 hover:text-white/80',
              )}
              style={isActive ? { background: 'rgba(72,155,110,0.2)' } : {}}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={16} style={{ color: isActive ? '#489B6E' : undefined }} />
              {item.label}
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full" style={{ background: '#489B6E' }} />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {hasMembership ? (
          // Un member peut basculer vers son espace pro
          <Link
            id="client-sidebar-member-space"
            href="/member"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#489B6E' }}
          >
            <ArrowLeftRight size={16} />
            Mon espace pro
          </Link>
        ) : (
          <Link
            id="client-sidebar-create-organization"
            href="/client/create-organization"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#489B6E' }}
          >
            <UserRoundPlus size={16} />
            Ouvrir son salon
          </Link>
        )}
      </div>

      {/* Menu utilisateur : infos + 3 points (profil / deconnexion), comme la vue member */}
      <div className="border-t p-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: 'rgba(72,155,110,0.25)' }}
          >
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-white/45">{user.email}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                id="client-sidebar-user-menu"
                type="button"
                aria-label="Ouvrir le menu"
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white/80 data-[state=open]:bg-white/10"
              >
                <EllipsisVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              sideOffset={4}
              className="min-w-56 rounded-lg"
            >
              {/* Infos du compte en haut du menu */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#489B6E]/15 text-xs font-bold text-[#489B6E]">
                    {getInitials(user.name)}
                  </div>
                  <div className="grid flex-1 leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href="/client/settings">
                  <User size={15} />
                  Mon profil
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer gap-2"
                onClick={async () => {
                  await signOut()
                  window.location.href = '/login'
                }}
              >
                <LogOut size={15} />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  )
}
