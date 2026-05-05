# CutBook — Planning detaille (27 jours)

> Demo day : 29 mai 2026
> Demo technique : ~15 mai | Demo blanche : ~22 mai

## Disponibilites

- **Samy** : mardi a vendredi (lundi = travail)
- **Adil** : lundi a dimanche (full time)

## Workflow Git

- `main` : production stable (merge uniquement apres validation)
- `dev` : branche d'integration
- `feat/xxx` : branches feature (1 par tache)
- PR obligatoire pour merge dans `dev`
- Code review par l'autre avant merge

---

## Semaine 1 (J1-J7) — Fondations

### Samy (Lead setup)

| Jour     | Tache                                                                                     | Branche              |
| -------- | ----------------------------------------------------------------------------------------- | -------------------- |
| J1 (mar) | Init Next.js + TS + Tailwind + shadcn + Prisma + tRPC                                     | `feat/init-project`  |
| J1       | Repo GitHub, branches main/dev, .env.example, README                                      | -                    |
| J2 (mer) | Schema Prisma complet (User, Salon, Coiffeur, Service, TimeSlot, Booking, Review, Reward) | `feat/prisma-schema` |
| J2       | Config Neon PostgreSQL + premiere migration + seed data                                   | -                    |
| J3 (jeu) | BetterAuth : email/password + Google OAuth + middleware protection                        | `feat/auth`          |
| J4 (ven) | tRPC setup + routers de base (salon, service, booking)                                    | `feat/trpc-setup`    |
| J5 (sam) | Deploiement Vercel initial + env vars + domaine                                           | `feat/deploy`        |
| J6 (dim) | Layout global (navbar, sidebar responsive, footer)                                        | `feat/layout`        |
| J7 (lun) | OFF (travail) — review PR d'Adil le soir si besoin                                        | -                    |

### Adil

| Jour     | Tache                                                               | Branche                   |
| -------- | ------------------------------------------------------------------- | ------------------------- |
| J1 (lun) | Onboarding : cloner repo, setup env local, comprendre la structure  | -                         |
| J2 (mar) | Pages auth UI : login, register (formulaires React Hook Form + Zod) | `feat/auth-pages`         |
| J3 (mer) | Pages auth UI : forgot password, verify email, reset password       | `feat/auth-pages`         |
| J4 (jeu) | Landing page publique (hero, features, CTA)                         | `feat/landing-page`       |
| J5 (ven) | Dashboard client : layout + page d'accueil + navigation             | `feat/client-dashboard`   |
| J6 (sam) | Dashboard membre : layout + page d'accueil + navigation             | `feat/coiffeur-dashboard` |
| J7 (dim) | Integration auth UI + BetterAuth (connecter les forms au backend)   | `feat/auth-integration`   |

### Taches transverses S1 (ajoutees post-planning initial)

Ajoutees en cours de S1 pour solidifier la base avant de coder le metier.
Coute du temps S1 mais fait gagner enormement sur S2-S4 (filet de securite,
zero bug bete, env reproductible).

| Tache                                                                                                                                                                                                                                              | Fait par    | Branche                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------- |
| Husky avance : 5 hooks (pre-commit no-main/dev + secretlint + lint-staged + vitest related, commit-msg max 5 mots + commitlint, prepare-commit-msg auto-ticket, pre-push branch naming + typecheck + lint + test + build, post-merge auto-install) | Samy        | `setup-repo-and-workflow` |
| Tooling qualite : Prettier + ESLint + commitlint + Vitest + Testing Library + cross-env                                                                                                                                                            | Samy        | `setup-repo-and-workflow` |
| GitHub Actions CI : workflow `validate` (lint + typecheck + test + build) sur PR vers main/dev, non-bypassable                                                                                                                                     | Samy        | `setup-repo-and-workflow` |
| `lib/env.ts` : validation Zod runtime des env vars via `@t3-oss/env-nextjs` (separation server/client)                                                                                                                                             | Samy        | `setup-repo-and-workflow` |
| Migration repo : V1 archivee sur `legacy/v1-python-flask` avec `git filter-repo` (purge secrets de tout l'historique)                                                                                                                              | Samy        | `legacy/v1-python-flask`  |
| `AGENTS.md` + `.claude/rules/` : 10 fichiers modulaires (stack, naming, structure, auth-pattern, code-style, seo-performance, workflow-git, security, tests, design-system) pour cadrer les agents IA et les devs                                  | Samy        | `setup-repo-and-workflow` |
| Palette Sanzo Wada complete dans `app/globals.css` (slate/green/gold 50-950, mapping shadcn, dark mode coherent) + Sora via `next/font` + metadata SEO root                                                                                        | Samy        | `setup-repo-and-workflow` |
| Pitch deck complet dans `docs/` (slides reveal.js, charte graphique HTML, palettes Sanzo Wada, architecture)                                                                                                                                       | Samy + Adil | `setup-repo-and-workflow` |

### Livrable S1

- Projet deploye sur Vercel (meme basique)
- Auth fonctionnelle (inscription, connexion, verification email)
- Schema BDD complet sur Neon
- Layouts client + coiffeur en place

---

## Semaine 2 (J8-J14) — Core Booking

### Samy

| Jour      | Tache                                                                       | Branche                    |
| --------- | --------------------------------------------------------------------------- | -------------------------- |
| J8 (mar)  | Router tRPC booking : creer/annuler reservation, lister par client/coiffeur | `feat/booking-api`         |
| J9 (mer)  | Router tRPC timeslots : CRUD creneaux, check disponibilite                  | `feat/timeslot-api`        |
| J10 (jeu) | Logique anti-double-booking (transaction Prisma + check atomique)           | `feat/booking-api`         |
| J11 (ven) | Router tRPC services : CRUD services par salon                              | `feat/service-api`         |
| J12 (sam) | Emails transactionnels Resend (confirmation, annulation, rappel)            | `feat/emails`              |
| J13 (dim) | Integration complete booking flow (front + back connectes)                  | `feat/booking-integration` |
| J14 (lun) | OFF — review + fix bugs                                                     | -                          |

### Adil

| Jour      | Tache                                                              | Branche                      |
| --------- | ------------------------------------------------------------------ | ---------------------------- |
| J8 (lun)  | Flow de reservation client : page choix salon + coiffeur           | `feat/booking-flow`          |
| J9 (mar)  | Flow de reservation : choix service + creneaux disponibles         | `feat/booking-flow`          |
| J10 (mer) | Flow de reservation : confirmation + recapitulatif                 | `feat/booking-flow`          |
| J11 (jeu) | Dashboard client : page "Mes RDV" (liste, statuts, annulation)     | `feat/client-bookings`       |
| J12 (ven) | Dashboard client : historique + details RDV                        | `feat/client-history`        |
| J13 (sam) | Dashboard membre : calendrier vue semaine (FullCalendar)           | `feat/coiffeur-calendar`     |
| J14 (dim) | Dashboard membre : gestion des creneaux (ajouter/supprimer dispos) | `feat/coiffeur-availability` |

### Livrable S2 — DEMO TECHNIQUE (~15 mai)

- Booking complet end-to-end (reserver, voir, annuler)
- Calendrier membre fonctionnel
- Emails de confirmation
- Dashboards client + coiffeur operationnels

---

## Semaine 3 (J15-J21) — Features avancees

### Samy

| Jour      | Tache                                                           | Branche            |
| --------- | --------------------------------------------------------------- | ------------------ |
| J15 (mar) | Stripe Checkout : creation session de paiement a la reservation | `feat/stripe`      |
| J16 (mer) | Stripe Webhooks : confirmation paiement, mise a jour booking    | `feat/stripe`      |
| J17 (jeu) | Multi-salon : adapter schema + routers pour gerer N salons      | `feat/multi-salon` |
| J18 (ven) | Multi-salon : logique de separation des donnees par salon       | `feat/multi-salon` |
| J19 (sam) | Programme fidelite : points, calcul rewards, router tRPC        | `feat/loyalty`     |
| J20 (dim) | Tests critiques : auth flow, booking flow, paiement             | `feat/tests`       |
| J21 (lun) | OFF — review + stabilisation                                    | -                  |

### Adil

| Jour      | Tache                                                            | Branche            |
| --------- | ---------------------------------------------------------------- | ------------------ |
| J15 (lun) | UI paiement : page checkout, confirmation paiement               | `feat/stripe-ui`   |
| J16 (mar) | UI paiement : historique paiements client                        | `feat/stripe-ui`   |
| J17 (mer) | Pages multi-salon : liste des salons, page detail salon          | `feat/salon-pages` |
| J18 (jeu) | Pages multi-salon : selection salon dans le flow booking         | `feat/salon-pages` |
| J19 (ven) | Systeme d'avis : formulaire review + affichage sur page coiffeur | `feat/reviews`     |
| J20 (sam) | Page fidelite client : points, recompenses, historique           | `feat/loyalty-ui`  |
| J21 (dim) | Bug fixes + polish UI general                                    | `fix/polish-s3`    |

### Livrable S3 — DEMO BLANCHE (~22 mai)

- Paiement Stripe fonctionnel (mode test)
- Multi-salon operationnel
- Fidelite + reviews en place
- Produit quasi-complet

---

## Semaine 4 (J22-J27) — Polish & Demo

### Samy

| Jour      | Tache                                                     | Branche         |
| --------- | --------------------------------------------------------- | --------------- |
| J22 (mar) | Dashboard admin : gestion salon, users, stats             | `feat/admin`    |
| J23 (mer) | Securite : rate limiting, headers, validation finale      | `feat/security` |
| J24 (jeu) | Performance : optimisation queries Prisma, loading states | `feat/perf`     |
| J25 (ven) | Bug fixes critiques                                       | `fix/final`     |
| J26 (sam) | Deploiement final + verification prod                     | -               |
| J27 (dim) | OFF ou preparation demo                                   | -               |

### Adil

| Jour      | Tache                                         | Branche           |
| --------- | --------------------------------------------- | ----------------- |
| J22 (lun) | UI admin : tableau de bord, gestion           | `feat/admin-ui`   |
| J23 (mar) | Responsive : toutes les pages mobile-friendly | `feat/responsive` |
| J24 (mer) | SEO : metadata, OpenGraph, sitemap            | `feat/seo`        |
| J25 (jeu) | Page 404/500 + polish animations              | `feat/polish`     |
| J26 (ven) | Preparation slides demo + repetition          | -                 |
| J27 (sam) | Repetition finale                             | -                 |

### Livrable S4 — DEMO DAY (29 mai)

- Produit complet, stable, deploye
- Demo prete (scenario de demo prepare)

---

## Risques & Plan B

| Risque                           | Probabilite | Impact              | Mitigation                                       |
| -------------------------------- | ----------- | ------------------- | ------------------------------------------------ |
| Stripe trop complexe             | Moyenne     | Feature paiement KO | Commencer tot S3, fallback "reserver sans payer" |
| Multi-salon retarde              | Faible      | Feature manquante   | MVP = 1 salon, multi-salon bonus                 |
| Conflits Git / blocage equipe    | Moyenne     | Retard general      | Daily standup 5min, PR petites et frequentes     |
| Bug critique avant demo          | Haute       | Demo ratee          | Freeze features J25, 2 jours de buffer           |
| Calendrier drag & drop trop hard | Moyenne     | UX degradee         | Fallback sur selection simple de creneaux        |
