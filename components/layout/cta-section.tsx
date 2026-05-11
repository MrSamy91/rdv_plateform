import Link from 'next/link'
import { ArrowRight, Scissors } from 'lucide-react'

export function CtaSection() {
  return (
    <section className="px-6 py-24 lg:px-8" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-2xl">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-14"
          style={{ background: '#253122' }}
        >
          {/* Grain */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          />

          {/* Icon */}
          <div
            className="relative mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(197,165,110,0.15)',
              border: '1px solid rgba(197,165,110,0.2)',
            }}
          >
            <Scissors size={22} style={{ color: '#C5A56E' }} className="rotate-90" />
          </div>

          <h2
            id="cta-heading"
            className="relative text-3xl font-black tracking-tight text-white sm:text-4xl"
          >
            Votre salon mérite
            <br />
            <span style={{ color: '#C5A56E' }}>mieux qu&apos;un carnet papier.</span>
          </h2>

          <p
            className="relative mt-5 text-base leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Rejoignez CutBook gratuitement. Aucune carte bancaire pour commencer.
          </p>

          <div className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              id="cta-register"
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#489B6E', color: '#fff' }}
            >
              Créer mon espace gratuitement
              <ArrowRight size={15} />
            </Link>
            <Link
              id="cta-login"
              href="/login"
              className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </div>

      {/* Footer minimaliste */}
      <footer className="mt-16 text-center">
        <p className="text-xs" style={{ color: 'rgba(37,49,34,0.3)' }}>
          © 2026 CutBook · Projet Holberton School Portfolio
        </p>
      </footer>
    </section>
  )
}
