'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  Gift,
  History,
  Home,
  LogOut,
  Menu,
  Scissors,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth/client'

const navItems = [
  { href: '/client', label: 'Accueil', icon: Home, exact: true },
  { href: '/client/bookings', label: 'Mes RDV', icon: CalendarDays, exact: false },
  { href: '/client/history', label: 'Historique', icon: History, exact: false },
  { href: '/client/rewards', label: 'Fidélité', icon: Gift, exact: false },
  { href: '/client/settings', label: 'Paramètres', icon: Settings, exact: false },
] as const

// ── Contenu de la sidebar (réutilisé desktop + mobile) ───────────────────────
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {/* Brand */}
      <div
        className="flex h-16 shrink-0 items-center gap-2.5 border-b px-5"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex size-7 items-center justify-center rounded-lg"
          style={{ background: '#489B6E' }}
        >
          <Scissors size={13} className="rotate-90 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-white">CutBook</span>

        {/* Bouton fermer (mobile uniquement) */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-white/50 transition-colors hover:text-white"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        )}
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
              onClick={onClose}
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
          id="client-sidebar-logout"
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
    </>
  )
}

// ── Sidebar desktop (fixe, toujours visible ≥ md) ────────────────────────────
export function ClientSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden w-60 shrink-0 flex-col md:flex"
        style={{ background: '#253122' }}
        aria-label="Navigation client"
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile : bouton hamburger (rendu dans le layout via slot) ──
           On expose le bouton hamburger dans un portail-like : il sera
           positionné dans le header via le composant MobileMenuButton */}
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform duration-300 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: '#253122' }}
        aria-label="Navigation client mobile"
        aria-hidden={!mobileOpen}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Bouton hamburger flottant (visible seulement sur mobile) */}
      <button
        id="client-mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 flex size-10 items-center justify-center rounded-xl shadow-lg md:hidden"
        style={{ background: '#253122' }}
        aria-label="Ouvrir le menu"
        aria-expanded={mobileOpen}
      >
        <Menu size={18} className="text-white" />
      </button>
    </>
  )
}
