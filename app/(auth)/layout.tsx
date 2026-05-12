import type { ReactNode } from 'react'
import { PublicNavbar } from '@/components/layout/public-navbar'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col" style={{ background: '#f9f7f3' }}>
      <PublicNavbar />
      {children}
    </div>
  )
}
