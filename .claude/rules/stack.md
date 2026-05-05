# Stack — strict, ne pas devier

| Couche      | Tech                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)                                                                         |
| Langage     | TypeScript **strict** (`"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`) |
| ORM         | Prisma 7 + driver adapter `@prisma/adapter-pg`                                                             |
| API         | tRPC + TanStack Query v5 + superjson                                                                       |
| Auth        | BetterAuth (email + Google OAuth)                                                                          |
| Paiement    | Stripe Checkout + Webhooks                                                                                 |
| Email       | React Email + Resend                                                                                       |
| BDD         | PostgreSQL (Neon prod / Docker dev)                                                                        |
| Hosting     | Vercel (CI/CD auto)                                                                                        |
| Styling     | Tailwind CSS v4                                                                                            |
| UI          | shadcn/ui (Radix UI)                                                                                       |
| Animations  | Framer Motion                                                                                              |
| Carousels   | SwiperJS (`swiper`)                                                                                        |
| Icons       | Lucide React                                                                                               |
| Calendar    | FullCalendar                                                                                               |
| Formulaires | React Hook Form + Zod                                                                                      |
| Tests       | Vitest + Testing Library                                                                                   |

## Package manager — pnpm exclusivement

- **JAMAIS** `npm`, `npx`, `pnpx`, `yarn`
- **TOUJOURS** `pnpm`, `pnpm dlx`, `pnpm exec`

## Next.js 16 — breaking changes

Cette version a des breaking changes par rapport aux connaissances pre-2026.
Avant d'ecrire du code Next.js, **lire le guide concerne dans `node_modules/next/dist/docs/`**.
Ne jamais ignorer une deprecation notice.

## Resoudre un probleme avec une lib

Avant de proposer un fix, rechercher la solution via le **Context7 MCP server** (docs a jour des libs). Ne pas se fier aux connaissances pre-2026.
