import type { Metadata } from 'next'

import { CtaSection } from '@/components/layout/cta-section'
import { FeaturesSection } from '@/components/layout/features-section'
import { HeroSection } from '@/components/layout/hero-section'
import { HowItWorksSection } from '@/components/layout/how-it-works-section'

export const metadata: Metadata = {
  // `absolute` court-circuite le template `%s | CutBook` du layout racine :
  // sur la home on ne veut pas d'un titre redondant « CutBook | CutBook ».
  title: { absolute: 'CutBook — Réservation en ligne pour coiffeurs, coachs & pros' },
  description:
    'Réservez en ligne chez votre coiffeur, coach ou esthéticienne. Booking en temps réel, paiement sécurisé Stripe, confirmations automatiques et programme de fidélité.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'CutBook — Réservation en ligne pour les pros',
    description:
      'Réservez en ligne chez votre coiffeur, coach ou esthéticienne. Paiement sécurisé, confirmations automatiques.',
  },
}

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </>
  )
}
