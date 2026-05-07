# Progress — CutBook V2

> Suivi de l'avancement du projet ligne par ligne (vs `02-planning-4-semaines.md`).
> Mis a jour : 7 mai 2026 (auth-flow depuis dev).

**Legende**

- ✅ Fait
- 🟡 Partiel (commence mais pas fini)
- 🔴 Pas commence
- ⏭️ Saute / a re-arbitrer

---

## Semaine 1 — Fondations (J1-J7)

### Samy

| J   | Tache                                                   | Status | Comment                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J1  | Init Next.js + TS + Tailwind + shadcn + Prisma + tRPC   | ✅     | `pnpm create next-app@latest` (TS strict, no `src/`, App Router, Turbopack). shadcn init avec Radix. Prisma 7 + adapter pg. tRPC v11 + TanStack Query v5 + superjson.                                                                                                                                                         |
| J1  | Repo GitHub, branches main/dev, .env.example, README    | ✅     | Repo `MrSamy91/rdv_plateform` reset (V1 archive sur `legacy/v1-python-flask` avec `git filter-repo` pour purger les secrets). Branches `main` (vide), `dev`, `setup-repo-and-workflow` (active), `legacy/v1-python-flask`. README + LICENSE + .gitignore + .env.example crees.                                                |
| J2  | Schema Prisma complet                                   | ✅     | 8 modeles metier (User, Organization, Member, Service, TimeSlot, Booking, Review, Reward) + 3 BetterAuth (Session, Account, Verification) + 3 enums (Role, BookingStatus, RewardStatus). Adapte vs planning : `Salon → Organization`, `Coiffeur → Member` pour ouvrir le modele a toute profession.                           |
| J2  | Config Neon PostgreSQL + premiere migration + seed data | 🟡     | **Docker local pret** (`docker-compose.yml` + adapter pg). **Neon prod prepare** via `@prisma/adapter-neon` en production et `@prisma/adapter-pg` en local/test/dev. Client Prisma 7 genere dans `generated/prisma`. `prisma/seed.ts` reste un placeholder.                                                                   |
| J3  | BetterAuth : email/password + Google OAuth + middleware | 🟡     | Module `lib/auth/` complet (`_config.ts`, `index.ts`, `client.ts`) + handler `app/api/auth/[...all]/route.ts`. Email+password configure, Google OAuth dans la config (besoin GOOGLE_CLIENT_ID/SECRET en env). **Middleware Next.js PAS ENCORE** (a faire pour proteger `(dashboard)/*`).                                      |
| J4  | tRPC setup + routers de base (salon, service, booking)  | 🟡     | tRPC complet : `lib/trpc/init.ts` (context + procedures public/protected), `lib/trpc/routers/index.ts` (app router), `lib/trpc/client.tsx` (Provider), `app/api/trpc/[trpc]/route.ts` (handler). **Router `organization` seul fait** (`getBySlug` + `create`). Manquent : `service`, `booking`, `member`, `review`, `reward`. |
| J5  | Deploiement Vercel initial + env vars + domaine         | 🟡     | Vercel build/preview valide apres fix Prisma 7, adapter Neon et env dynamiques (`VERCEL_BRANCH_URL`, `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`). Domaine custom et verification prod finale restent a faire.                                                                                                              |
| J6  | Layout global (navbar, sidebar responsive, footer)      | 🔴     | Pas commence. A faire : `components/layout/navbar.tsx`, `sidebar.tsx`, `footer.tsx`.                                                                                                                                                                                                                                          |
| J7  | OFF (lundi)                                             | —      | —                                                                                                                                                                                                                                                                                                                             |

### Adil

| J        | Tache                                                                          | Status | Comment                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J1 (lun) | Onboarding : cloner repo, setup env local, comprendre la structure             | ✅     | `docs/onboarding.md` cree (25 min de lecture, pedagogique : stack, raison de chaque techno, workflow git, conventions kebab-case). Adil pourra demarrer lundi 6 mai.   |
| J2-J3    | Pages auth UI : login, register, forgot password, verify email, reset password | ✅     | Branche `auth-flow` : routes `app/(auth)/*`, shell auth partage, formulaires BetterAuth email/password + Google OAuth, tests de regression `AuthShell` et `LoginForm`. |
| J4       | Landing page publique                                                          | 🟡     | Prototype CutBook deja en place dans `app/page.tsx` (plus de boilerplate Next.js). Reste a finaliser le contenu/CTA selon la version demo.                             |
| J5       | Dashboard client : layout + page d'accueil + navigation                        | 🔴     | Pas commence.                                                                                                                                                          |
| J6       | Dashboard membre : layout + page d'accueil + navigation                        | 🔴     | Pas commence.                                                                                                                                                          |
| J7       | Integration auth UI + BetterAuth                                               | 🟡     | Login email/password branche via BetterAuth sans tRPC et redirige vers `/client`. `app/(protected)/client/page.tsx` minimal ajoute pour valider le flow.               |

### Taches transverses S1 (bonus)

| Tache                                     | Fait par    | Status | Comment                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Husky 5 hooks stricts                     | Samy        | ✅     | pre-commit (no-main/dev + secretlint + lint-staged + vitest related), commit-msg (max 5 mots + commitlint), prepare-commit-msg (auto-prefix #ticket si nombre dans le nom de branche), pre-push (branch naming + typecheck + lint + test + build), post-merge (auto pnpm install).                                                                         |
| Tooling qualite                           | Samy        | ✅     | Prettier + ESLint + commitlint + Vitest + Testing Library + cross-env + secretlint + jsdom + tsx + dotenv. Scripts package.json : `dev`, `build`, `build:check`, `test`, `test:watch`, `test:ui`, `lint`, `lint:fix`, `typecheck`, `format`, `format:check`, `secretlint`, `db:*`.                                                                         |
| GitHub Actions CI                         | Samy        | ✅     | `.github/workflows/ci.yml` : job `validate` (Setup pnpm + Node 20 + cache, install, prisma generate, secretlint, typecheck, lint, test, build:check) sur `pull_request` vers main/dev. ~2-3 min. Previews gerees par Vercel uniquement; Netlify n'est plus utilise. **A activer côté GitHub UI** : Settings > Branches > require status checks `Validate`. |
| `lib/env.ts` validation Zod               | Samy        | ✅     | `@t3-oss/env-nextjs` separe server/client. Vars critiques assouplies pour ne pas bloquer les previews; garde-fous runtime cibles (`DATABASE_URL` requis hors build check). URLs app/auth deduites dynamiquement depuis Vercel ou fallback local.                                                                                                           |
| Migration repo + purge secrets            | Samy        | ✅     | V1 deplacee sur `legacy/v1-python-flask`. Secrets purges de tout l'historique avec `git filter-repo` (password Gmail `omdt leke zdgu ghwm` + `SECRET_KEY = 'admin'` + email rdvplateform@gmail.com). ⚠️ **Action manuelle requise** : revoquer le password Gmail sur https://myaccount.google.com/apppasswords.                                            |
| `AGENTS.md` + `.claude/rules/` modulaires | Samy        | ✅     | 10 fichiers : stack.md, naming.md, structure.md, auth-pattern.md, code-style.md, seo-performance.md, workflow-git.md, security.md, tests.md, design-system.md. AGENTS.md = sommaire.                                                                                                                                                                       |
| Palette Sanzo Wada + Sora + SEO           | Samy        | ✅     | `app/globals.css` complet (slate/green/gold 50-950 + mapping shadcn + dark mode). `app/layout.tsx` : Sora via `next/font` + metadata complete (title template, OG, Twitter, lang fr).                                                                                                                                                                      |
| Pitch deck complet                        | Samy + Adil | ✅     | `docs/01-slide-deck.md`, `docs/02-planning-4-semaines.md`, `docs/03-architecture.md`, `docs/charte-graphique.html`, `docs/palettes.html`, `docs/presentation.html` (reveal.js, palette Sanzo + Sora + Lucide icons).                                                                                                                                       |

### Livrable S1 (objectif)

- 🔴 Projet deploye sur Vercel (meme basique)
- 🟡 Auth fonctionnelle (backend + UI auth, protection layout `(protected)` minimale, reste roles/member/owner)
- 🟡 Schema BDD complet (sur Neon : a faire / sur Docker local : ok)
- 🔴 Layouts client + coiffeur en place

---

## Semaine 2 — Core Booking (J8-J14)

### Samy

| J   | Tache                                            | Status |
| --- | ------------------------------------------------ | ------ |
| J8  | Router tRPC booking (creer/annuler, lister)      | 🔴     |
| J9  | Router tRPC timeslots (CRUD, check dispo)        | 🔴     |
| J10 | Logique anti-double-booking (transaction Prisma) | 🔴     |
| J11 | Router tRPC services (CRUD par salon)            | 🔴     |
| J12 | Emails Resend (confirmation, annulation, rappel) | 🔴     |
| J13 | Integration booking flow front + back            | 🔴     |
| J14 | OFF — review + fix                               | —      |

### Adil

| J   | Tache                                                | Status |
| --- | ---------------------------------------------------- | ------ |
| J8  | Page choix salon + coiffeur                          | 🔴     |
| J9  | Page choix service + creneaux                        | 🔴     |
| J10 | Page confirmation + recap                            | 🔴     |
| J11 | Dashboard client : "Mes RDV"                         | 🔴     |
| J12 | Dashboard client : historique + details              | 🔴     |
| J13 | Dashboard membre : calendrier semaine (FullCalendar) | 🔴     |
| J14 | Dashboard membre : gestion creneaux                  | 🔴     |

### Livrable S2 — DEMO TECHNIQUE (~15 mai)

🔴 Booking complet end-to-end · Calendrier membre · Emails de confirmation · Dashboards client + coiffeur

---

## Semaine 3 — Features avancees (J15-J21)

### Samy

| J       | Tache                                        | Status                                   |
| ------- | -------------------------------------------- | ---------------------------------------- |
| J15     | Stripe Checkout : creation session paiement  | 🔴                                       |
| J16     | Stripe Webhooks : confirmation + maj booking | 🔴                                       |
| J17-J18 | Multi-salon : adapter schema + routers       | 🟡 deja prevu via le modele Organization |
| J19     | Programme fidelite : points, calcul rewards  | 🔴                                       |
| J20     | Tests critiques (auth, booking, paiement)    | 🔴                                       |
| J21     | OFF — review                                 | —                                        |

### Adil

| J       | Tache                                        | Status |
| ------- | -------------------------------------------- | ------ |
| J15-J16 | UI paiement (checkout, historique)           | 🔴     |
| J17-J18 | Pages multi-salon (liste, detail, selection) | 🔴     |
| J19     | Systeme d'avis (formulaire + affichage)      | 🔴     |
| J20     | Page fidelite client                         | 🔴     |
| J21     | Bug fixes + polish                           | 🔴     |

### Livrable S3 — DEMO BLANCHE (~22 mai)

🔴 Paiement Stripe · Multi-salon · Fidelite + reviews · Quasi-complet

---

## Semaine 4 — Polish & Demo (J22-J27)

### Samy

| J   | Tache                                                | Status                                     |
| --- | ---------------------------------------------------- | ------------------------------------------ |
| J22 | Dashboard admin (gestion salon, users, stats)        | 🔴                                         |
| J23 | Securite : rate limiting, headers, validation finale | 🟡 deja en partie via BetterAuth + lib/env |
| J24 | Performance : queries Prisma, loading states         | 🔴                                         |
| J25 | Bug fixes critiques                                  | 🔴                                         |
| J26 | Deploiement final + verif prod                       | 🔴                                         |
| J27 | OFF / prep demo                                      | —                                          |

### Adil

| J       | Tache                                      | Status                                                            |
| ------- | ------------------------------------------ | ----------------------------------------------------------------- |
| J22     | UI admin : tableau de bord                 | 🔴                                                                |
| J23     | Responsive mobile-first (toutes les pages) | 🔴                                                                |
| J24     | SEO : metadata, OG, sitemap                | 🟡 metadata root deja en place, manque sitemap + page-specific OG |
| J25     | Page 404/500 + polish animations           | 🔴                                                                |
| J26-J27 | Slides demo + repetition                   | 🟡 slides pitch deja faites, demo scenario a preparer             |

### Livrable S4 — DEMO DAY (29 mai)

🔴 Produit complet, stable, deploye · Demo prete

---

## Bilan rapide (vendredi 5 mai 2026, fin J1 reel)

**Avance** :

- Toutes les fondations qualite (Husky, CI, env validation, rules) — gros gain pour la suite
- Charte graphique appliquee tot (Sanzo Wada + Sora) — gain UI
- Schema Prisma + BetterAuth + tRPC poses — backend pret a coder

**Retard** :

- Domaine custom + verification prod finale Vercel (J5)
- Middleware auth + 5 routers tRPC restants (a finir avant J8)
- Tous les ecrans auth + dashboards — gros chantier d'Adil. La landing a deja un prototype CutBook.
- Layout global (navbar, sidebar, footer)

**Risques** :

- Si Vercel + Neon pas en place lundi, Adil ne peut pas tester en conditions reelles
- Le retard sur le frontend doit etre rattrape sur S2 (mais S2 = booking flow, gros morceau aussi)
