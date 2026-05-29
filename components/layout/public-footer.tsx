import Link from 'next/link'
import { Logo } from '@/components/brand/logo'

const CURRENT_YEAR = new Date().getFullYear()

const NAV_LINKS = [
  { label: 'Trouver un pro', href: '/search' },
  { label: 'Connexion', href: '/login' },
  { label: 'Créer un compte', href: '/register' },
]

const LEGAL_LINKS = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGU', href: '/cgu' },
  { label: 'Politique de confidentialité', href: '/confidentialite' },
]

// Footer visible uniquement sur les pages publiques ((public)/layout.tsx).
// Server Component — pas de 'use client'.
export function PublicFooter() {
  return (
    <footer
      style={{ background: '#253122', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      aria-label="Pied de page"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        {/* Grille principale */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Colonne marque */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex text-white transition-opacity hover:opacity-80">
              {/* Compose pour heriter de text-white sur fond sombre ; le mark image
                  reste lisible grace a ses tons or centraux. */}
              <Logo variant="compose" size="md" />
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              La plateforme de réservation en ligne pour les professionnels. Réservez en quelques
              secondes, 24h/24.
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © {CURRENT_YEAR} CutBook — Holberton School
            </p>
          </div>

          {/* Colonne navigation */}
          <div>
            <p
              className="mb-4 text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Explorer
            </p>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne légal */}
          <div>
            <p
              className="mb-4 text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Informations
            </p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Barre du bas */}
        <div
          className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Powered by <span style={{ color: 'rgba(255,255,255,0.55)' }}>Adil &amp; Samy</span> —
            Holberton School 2026
          </p>
          <a
            href="https://github.com/MrSamy91/rdv_plateform"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Voir le code source sur GitHub"
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {/* GitHub mark — SVG officiel */}
            <svg viewBox="0 0 24 24" aria-hidden className="size-3.5 fill-current">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Code source
          </a>
        </div>
      </div>
    </footer>
  )
}
