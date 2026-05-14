import type { Metadata } from 'next'

import { CtaSection } from '@/components/layout/cta-section'
import { FeaturesSection } from '@/components/layout/features-section'
import { HeroSection } from '@/components/layout/hero-section'
import { HowItWorksSection } from '@/components/layout/how-it-works-section'
import { PublicFooter } from '@/components/layout/public-footer'
import { PublicNavbar } from '@/components/layout/public-navbar'

export const metadata: Metadata = {
  title: 'CutBook - Réservation en ligne pour professionnels',
  description:
    'Réservez en ligne chez votre coiffeur, coach ou esthéticienne. Paiement sécurisé, confirmations automatiques, programme de fidélité.',
  openGraph: {
    title: 'CutBook - Réservation en ligne pour professionnels',
    description:
      'Réservez en ligne chez votre coiffeur, coach ou esthéticienne. Paiement sécurisé, confirmations automatiques, programme de fidélité.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col" style={{ background: '#f9f7f3' }}>
      <PublicNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <PublicFooter />
    </div>
  )
}
