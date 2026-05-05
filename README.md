# CutBook

Plateforme de reservation en ligne pour professionnels.

> Migration V2 (Next.js) du projet RDV Plateforme (V1 Python/Flask).

## Stack

- **Framework** : Next.js 16 (App Router) + TypeScript
- **UI** : Tailwind CSS v4 + shadcn/ui + Framer Motion
- **API** : tRPC + TanStack Query v5
- **ORM** : Prisma
- **Auth** : BetterAuth (email + Google OAuth)
- **Paiement** : Stripe Checkout + Webhooks
- **Email** : React Email + Resend
- **BDD** : PostgreSQL (Neon prod / Docker dev)
- **Hosting** : Vercel
- **Quality** : Husky + lint-staged + ESLint + commitlint

## Branches

- `main` — production
- `dev` — integration
- `setup-repo-and-workflow` — branche de travail initiale (setup outillage + workflow)
- `legacy/v1-python-flask` — V1 archivee (lecture seule)

## Demarrage

A venir une fois le setup termine.
