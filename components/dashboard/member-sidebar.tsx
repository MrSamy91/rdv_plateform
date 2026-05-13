'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Clock, User, LogOut, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth/client'

const navItems = [
  { href: '/member', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/member/calendar', label: 'Mon calendrier', icon: CalendarDays, exact: false },
  { href: '/member/availability', label: 'Mes créneaux', icon: Clock, exact: false },
  { href: '/member/profile', label: 'Mon profil', icon: User, exact: false },
] as const

export function MemberSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex w-64 shrink-0 flex-col"
      style={{ background: '#253122' }}
      aria-label="Navigation professionnel"
    >
      {/* Brand */}
      <div
        className="flex h-16 items-center gap-2.5 border-b px-5"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex size-7 items-center justify-center rounded-lg"
          style={{ background: '#489B6E' }}
        >
          <Scissors size={13} className="rotate-90 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-white">CutBook</span>
        <span
          className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase"
          style={{ background: 'rgba(72,155,110,0.25)', color: '#489B6E' }}
        >
          Pro
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Navigation professionnel">
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

      {/* Logout */}
      <div className="border-t p-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          id="member-sidebar-logout"
          type="button"
          onClick={async () => {
            await signOut()
            window.location.href = '/login'
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
