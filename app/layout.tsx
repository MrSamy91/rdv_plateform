import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import { getServerAppUrl } from '@/lib/env'
import { TRPCProvider } from '@/lib/trpc/client'
import './globals.css'

// Police Sora (Google Fonts) — voir docs/charte-graphique.html
// Tous les poids charges car la charte utilise 300 a 800.
const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CutBook — Reservation en ligne pour pros',
    template: '%s | CutBook',
  },
  description:
    'Plateforme de reservation en ligne adaptable a tout type de profession (coiffeur, coach, esthetique, medecin...). Booking temps reel + paiement Stripe.',
  keywords: ['reservation', 'rdv', 'booking', 'salon', 'pro', 'planning', 'agenda en ligne'],
  authors: [{ name: 'Samy & Adil' }],
  creator: 'CutBook Team',
  metadataBase: new URL(getServerAppUrl()),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    title: 'CutBook',
    description: 'La plateforme de reservation en ligne pour les pros',
    siteName: 'CutBook',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CutBook',
    description: 'La plateforme de reservation en ligne pour les pros',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${sora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
