'use client'

// global-error.tsx remplace intégralement le root layout en cas d'erreur critique.
// Doit contenir ses propres <html> et <body>.

import { RefreshCw, TriangleAlert } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          background: '#f9f7f3',
          display: 'flex',
          minHeight: '100svh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '28rem', width: '100%' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '5rem',
              height: '5rem',
              borderRadius: '1rem',
              background: 'rgba(220,38,38,0.08)',
              border: '2px solid rgba(220,38,38,0.15)',
              marginBottom: '2rem',
            }}
          >
            <TriangleAlert size={34} style={{ color: '#dc2626' }} />
          </div>

          <h1
            style={{
              margin: '0 0 0.75rem',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#253122',
            }}
          >
            Erreur critique
          </h1>
          <p
            style={{
              margin: '0 0 2rem',
              fontSize: '0.875rem',
              color: 'rgba(37,49,34,0.55)',
              lineHeight: 1.6,
            }}
          >
            L&apos;application a rencontré un problème grave.
            <br />
            {error.digest && (
              <span style={{ fontFamily: 'monospace', color: 'rgba(37,49,34,0.3)' }}>
                ref: {error.digest}
              </span>
            )}
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#489B6E',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            Recharger
          </button>
        </div>
      </body>
    </html>
  )
}
