'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, TriangleAlert } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // En production on logguerait vers un service (Sentry, etc.)
    console.error('[CutBook Error]', error)
  }, [error])

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center px-6 py-20"
      style={{ background: '#f9f7f3' }}
    >
      <div className="w-full max-w-md text-center">
        {/* Icône erreur animée */}
        <div className="mb-8 flex justify-center">
          <div
            className="flex size-20 items-center justify-center rounded-2xl shadow-lg"
            style={{
              background: 'rgba(220,38,38,0.08)',
              border: '2px solid rgba(220,38,38,0.15)',
              animation: 'cutbook-shake 0.5s ease-in-out',
            }}
          >
            <TriangleAlert size={34} style={{ color: '#dc2626' }} />
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-extrabold" style={{ color: '#253122' }}>
          Une erreur s&apos;est produite
        </h1>
        <p className="mb-2 text-sm leading-relaxed" style={{ color: 'rgba(37,49,34,0.55)' }}>
          Le serveur a rencontré un problème inattendu.
          <br />
          Réessayez ou revenez à l&apos;accueil.
        </p>

        {/* Code d'erreur (debug) */}
        {error.digest && (
          <p className="mb-8 font-mono text-xs" style={{ color: 'rgba(37,49,34,0.3)' }}>
            ref: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#489B6E' }}
          >
            <RefreshCw size={14} />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ borderColor: 'rgba(37,49,34,0.2)', color: '#253122' }}
          >
            <ArrowLeft size={14} />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
