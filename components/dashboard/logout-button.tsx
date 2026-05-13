'use client'

import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth/client'

export function LogoutButton() {
  return (
    <button
      id="client-logout"
      type="button"
      onClick={async () => {
        await signOut()
        window.location.href = '/login'
      }}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-black/[.05]"
      style={{ color: 'rgba(37,49,34,0.5)' }}
    >
      <LogOut size={15} />
      Déconnexion
    </button>
  )
}
