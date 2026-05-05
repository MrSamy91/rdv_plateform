# SEO & Performance

## Metadata obligatoire

Definir `metadata` dans **chaque** `layout.tsx` et `page.tsx`.

```typescript
// Pour pages statiques
export const metadata: Metadata = {
  title: 'CutBook — Reservation en ligne',
  description: '...',
  openGraph: { ... },
  twitter: { ... },
}

// Pour pages dynamiques (ex: /@slug)
export async function generateMetadata({ params }): Promise<Metadata> {
  const org = await getOrg(params.slug)
  return {
    title: `${org.name} — CutBook`,
    description: org.description,
  }
}
```

## SSR par defaut

- Utiliser le Server-Side Rendering au max.
- Privilegier les **Server Components** (voir `code-style.md`).
- Ne **jamais** abuser du `"use client"`.

## Images

- **Toujours** `next/image` avec `alt`, `width`, `height`.
- Pourquoi : optimisation auto (WebP, lazy loading, responsive), SEO, accessibilite.

```tsx
import Image from 'next/image'
;<Image src="/hero.jpg" alt="Hero CutBook" width={1200} height={600} />
```

## Balises semantiques

- `<main>`, `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`.
- Pourquoi : accessibilite (lecteurs d'ecran), SEO (Google comprend mieux la structure).
- Eviter les `<div>` empiles partout.

## Performance checklist

- [ ] Server Component si possible
- [ ] Image avec `next/image`
- [ ] Pas de polices custom hors `next/font`
- [ ] Pas de scripts client dans le layout root
- [ ] Cache TanStack Query configure (`staleTime: 60s` par defaut)
