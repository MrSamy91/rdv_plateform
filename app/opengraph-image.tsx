import { createCutbookOgImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/cutbook-og'

// Image OG de marque, héritée par toutes les routes sans override (landing,
// recherche, pages auth...). Les pages établissement la remplacent par leur
// propre image dynamique.
export const alt = 'CutBook — la réservation en ligne pour les pros'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return createCutbookOgImage({
    title: 'Réservez en ligne, en 2 clics',
    subtitle: 'Coiffeur, coach, esthétique, santé... votre pro disponible en temps réel.',
  })
}
