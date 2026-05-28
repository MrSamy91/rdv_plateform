import { createCutbookOgImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/cutbook-og'
import { getPublicOrganizationMetaBySlug } from '@/lib/organizations/public-organization'

export const alt = 'Réservez votre rendez-vous en ligne sur CutBook'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

interface Props {
  params: Promise<{ 'org-slug': string }>
}

// Coupe proprement une description trop longue pour ne pas déborder du visuel.
function truncate(text: string, max = 110) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export default async function Image({ params }: Props) {
  const { 'org-slug': orgSlug } = await params
  const org = await getPublicOrganizationMetaBySlug(orgSlug)

  return createCutbookOgImage({
    title: org?.name ?? 'Établissement',
    subtitle: org?.description
      ? truncate(org.description)
      : 'Réservez votre rendez-vous en quelques clics.',
  })
}
