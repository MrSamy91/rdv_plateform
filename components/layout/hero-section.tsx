import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section
      className="relative flex min-h-[92vh] flex-col overflow-hidden"
      style={{ background: '#253122' }}
    >
      {/* Grain texture overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-12">
        {/* Tag */}
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-widest uppercase"
          style={{
            borderColor: 'rgba(197,165,110,0.3)',
            color: '#C5A56E',
            background: 'rgba(197,165,110,0.07)',
          }}
        >
          <span className="size-1.5 rounded-full" style={{ background: '#C5A56E' }} />
          Plateforme de réservation
        </div>

        {/* Heading */}
        <h1
          className="max-w-3xl text-5xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl lg:text-7xl"
          style={{ fontFamily: 'var(--font-sora, sans-serif)' }}
        >
          Vos clients réservent.
          <br />
          <span style={{ color: '#C5A56E' }}>Vous, vous coiffez.</span>
        </h1>

        <p
          className="mt-7 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          CutBook est la plateforme taillée pour les coiffeurs, barbiers et coachs indépendants.
          Réservation en ligne, paiement Stripe, fidélité automatique.
        </p>

        {/* CTA pair */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            id="hero-cta-register"
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#489B6E', color: '#fff' }}
          >
            Ouvrir mon espace gratuit
            <ArrowRight size={15} />
          </Link>
          <Link
            id="hero-cta-login"
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            J&apos;ai déjà un compte
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-10 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Aucune carte bancaire requise · Gratuit pour démarrer
        </p>
      </div>

      {/* Bottom fade into content */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 left-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, transparent, #f9f7f3)',
        }}
      />
    </section>
  )
}
