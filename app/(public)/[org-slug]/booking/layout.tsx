import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Le tunnel de réservation (choix → créneau → confirmation) repose sur des
// searchParams non canoniques et n'a aucune valeur SEO. On l'exclut de l'index
// pour tout le sous-arbre booking d'un coup, plutôt que page par page.
// `follow: true` laisse les crawlers suivre le lien retour vers la fiche.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function BookingLayout({ children }: { children: ReactNode }) {
  return children
}
