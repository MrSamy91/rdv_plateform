# Design system

## Palette — Sanzo Wada

3 couleurs de base extraites du livre "A Dictionary of Color Combinations" (Sanzo Wada, 1933) :

| Role       | Nom              | Hex       | Usage                      |
| ---------- | ---------------- | --------- | -------------------------- |
| Primaire   | Deep Slate Olive | `#253122` | Textes, titres, ancrage    |
| Secondaire | Green            | `#489B6E` | Actions, CTA, liens        |
| Accent     | Isabella         | `#C5A56E` | Highlights, accents chauds |

## Police — Sora

Google Fonts. Charger via `next/font` :

```tsx
import { Sora } from 'next/font/google'

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-sora',
})
```

Echelle typographique definie dans `docs/charte-graphique.html` (H1 a Caption).

## Regle 60-30-10

- **60%** : fonds clairs + texte slate (la majorite de l'interface)
- **30%** : green (CTA, boutons, liens, icones d'accent)
- **10%** : gold/Isabella (highlights, mise en avant ponctuelle)

## Variables CSS

**Toutes** les couleurs sont definies en variables CSS dans `app/globals.css`.
Palette etendue 50-950 disponible pour chaque couleur de base.

⚠️ **Ne jamais hardcoder une couleur** dans un composant (`bg-[#489B6E]`, `text-green-500` Tailwind par defaut, etc.). Toujours utiliser les variables shadcn (`bg-primary`, `bg-accent`, etc.).

## Reference

- `docs/charte-graphique.html` — design system complet (palette, typographie, composants references)
- `docs/palettes.html` — exploration des palettes Sanzo Wada
