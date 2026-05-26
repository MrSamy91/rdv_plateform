import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Page introuvable — CutBook',
  description: 'Cette page est introuvable.',
}

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col" style={{ background: '#f9f7f3' }}>
      <style>{`
        @keyframes cutbook-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-md text-center">
          <div className="relative mb-10 flex justify-center">
            <span
              aria-hidden
              className="pointer-events-none leading-none font-black tracking-tighter select-none"
              style={{
                fontSize: 'clamp(6rem, 20vw, 11rem)',
                color: 'rgba(37,49,34,0.06)',
                lineHeight: 1,
              }}
            >
              404
            </span>
          </div>

          <h1 className="mb-3 text-2xl font-extrabold" style={{ color: '#253122' }}>
            Page introuvable
          </h1>
          <p className="mb-10 text-sm leading-relaxed" style={{ color: 'rgba(37,49,34,0.55)' }}>
            Cette page n&apos;existe pas ou a été déplacée.
            <br />
            Vérifiez l&apos;URL ou retournez à l&apos;accueil.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#489B6E' }}
            >
              <ArrowLeft size={14} />
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ borderColor: 'rgba(37,49,34,0.2)', color: '#253122' }}
            >
              <Search size={14} />
              Trouver un pro
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
