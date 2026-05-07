import Link from 'next/link'
import { Scissors } from 'lucide-react'
import { AuthBrandPanel } from '@/components/auth/auth-brand-panel'

interface AuthShellProps {
  title: string
  description?: string
  brandTitle: string
  brandHighlight: string
  brandDescription: string
  brandStats?: Array<{
    value: string
    label: string
  }>
  children: React.ReactNode
}

export function AuthShell({
  title,
  description,
  brandTitle,
  brandHighlight,
  brandDescription,
  brandStats,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-svh" style={{ background: '#f9f7f3' }}>
      <AuthBrandPanel
        title={brandTitle}
        highlight={brandHighlight}
        description={brandDescription}
        stats={brandStats}
      />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <div
              className="flex size-7 items-center justify-center rounded-lg"
              style={{ background: '#489B6E' }}
            >
              <Scissors size={13} className="rotate-90 text-white" />
            </div>
            <span className="font-bold tracking-tight" style={{ color: '#253122' }}>
              CutBook
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: '#253122' }}>
              {title}
            </h1>
            {description && <p className="text-muted-foreground mt-2 text-sm">{description}</p>}
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
