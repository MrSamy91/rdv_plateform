// Générateur d'images Open Graph maison (next/og + Satori).
//
// Pourquoi un module partagé : la landing, la recherche et chaque page
// établissement ont besoin d'une image OG cohérente (même charte Sanzo Wada,
// même typo Sora). On factorise ici le design, le chargement de font et la
// taille pour que chaque route `opengraph-image.tsx` ne soit qu'un appel.
import { ImageResponse } from 'next/og'

// Dimensions standard OG/Twitter (ratio 1.91:1 attendu par Facebook, LinkedIn,
// X, WhatsApp, iMessage, Slack, Discord...).
export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png'

// Palette de la charte (cf. .claude/rules/design-system.md). Hors composants
// React on ne peut pas lire les variables CSS shadcn, donc on duplique les hex
// ici — c'est le seul endroit autorisé à le faire (rendu serveur Satori).
const COLORS = {
  bg: '#f9f7f3',
  slate: '#253122',
  green: '#489B6E',
  gold: '#C5A56E',
}

// Charge la font Sora depuis Google Fonts pour Satori (qui n'accepte que
// ttf/otf/woff, jamais woff2). Le param `text` ne sous-charge que les glyphes
// réellement affichés → payload minimal. En cas d'échec réseau (ex: build CI
// hors ligne) on renvoie null : ImageResponse retombe alors sur sa font par
// défaut plutôt que de casser le build.
async function loadSoraFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Sora:wght@800&text=${encodeURIComponent(text)}`
    const css = await (await fetch(url)).text()
    const resource = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)

    if (!resource?.[1]) {
      return null
    }

    const fontResponse = await fetch(resource[1])
    if (!fontResponse.ok) {
      return null
    }

    return await fontResponse.arrayBuffer()
  } catch {
    return null
  }
}

interface CutbookOgImageInput {
  /** Gros titre (nom de l'établissement ou accroche de la page). */
  title: string
  /** Phrase de soutien sous le titre. */
  subtitle: string
  /** Surtitre doré en capitales (contexte de la page). */
  kicker?: string
}

export async function createCutbookOgImage({
  title,
  subtitle,
  kicker = 'Réservation en ligne',
}: CutbookOgImageInput) {
  const fontData = await loadSoraFont(`CutBook${kicker}${title}${subtitle}`)

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: COLORS.bg,
          padding: '72px 80px',
          fontFamily: 'Sora',
        }}
      >
        {/* En-tête : badge ciseaux + wordmark de marque (toujours "CutBook"). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: COLORS.green,
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="6" r="3" />
              <path d="M8.12 8.12 12 12" />
              <path d="M20 4 8.12 15.88" />
              <circle cx="6" cy="18" r="3" />
              <path d="M14.8 14.8 20 20" />
            </svg>
          </div>
          <span style={{ fontSize: 34, color: COLORS.slate }}>CutBook</span>
        </div>

        {/* Corps : surtitre doré, titre principal, sous-titre. */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: COLORS.gold,
              marginBottom: 20,
            }}
          >
            {kicker}
          </span>
          <span
            style={{
              fontSize: 76,
              color: COLORS.slate,
              lineHeight: 1.05,
              maxWidth: 920,
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 30,
              color: 'rgba(37,49,34,0.6)',
              marginTop: 24,
              maxWidth: 820,
            }}
          >
            {subtitle}
          </span>
        </div>

        {/* Barre d'accent (60-30-10 : green dominant, gold ponctuel). */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 80, height: 8, borderRadius: 99, backgroundColor: COLORS.green }} />
          <div style={{ width: 28, height: 8, borderRadius: 99, backgroundColor: COLORS.gold }} />
          <div
            style={{ width: 14, height: 8, borderRadius: 99, backgroundColor: 'rgba(37,49,34,0.15)' }}
          />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: fontData
        ? [{ name: 'Sora', data: fontData, weight: 800 as const, style: 'normal' as const }]
        : undefined,
    },
  )
}
