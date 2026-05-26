import Link from 'next/link'
import { CalendarCheck } from 'lucide-react'
import { getSession } from '@/lib/auth'

export async function PublicNavbar() {
  const session = await getSession()

  return (
    <nav
      className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6"
      style={{ borderColor: 'rgba(37,49,34,0.1)', background: '#f9f7f3' }}
      aria-label="Navigation principale"
    >
      <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
        <span
          className="flex size-7 items-center justify-center rounded-lg"
          style={{ background: '#489B6E', color: '#fff' }}
        >
          <CalendarCheck size={15} />
        </span>
        <span className="text-sm font-bold tracking-tight" style={{ color: '#253122' }}>
          CutBook
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/search"
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(37,49,34,0.65)' }}
        >
          Trouver un pro
        </Link>
        <Link
          href={session ? '/client/become-member' : '/login?callbackUrl=/client/become-member'}
          className="rounded-lg border px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ borderColor: 'rgba(72,155,110,0.4)', color: '#489B6E' }}
        >
          Deviens pro
        </Link>
        {session ? (
          <Link
            href="/client"
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#489B6E' }}
          >
            Mon espace
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ borderColor: 'rgba(37,49,34,0.2)', color: '#253122' }}
          >
            Connexion
          </Link>
        )}
      </div>
    </nav>
  )
}
