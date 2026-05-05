# CutBook — Slide Deck (Google Slides)

> Pitch max 10 min | Google Slides | Holberton Portfolio Project

## Slide 1 : Titre
- **CutBook**
- La plateforme de reservation en ligne pour professionnels
- Samy & Adil
- Holberton School — Webstack Portfolio Project 2026

## Slide 2 : L'equipe
- **Samy** — Lead Fullstack & DevOps
  - Stack : Next.js, TypeScript, Prisma, tRPC, Vercel, Docker
  - Disponibilite : mardi a vendredi (lundi = travail)
- **Adil** — Fullstack Developer
  - Stack : Next.js, TypeScript, Prisma
  - Disponibilite : full time (lundi a dimanche)
- Duo reforme : deja collabore sur la V1 (Python/Flask, 2e annee)
- Cette fois : workflow structure (Git Flow, PR reviews, Husky, Kanban)

## Slide 3 : Le probleme
- Beaucoup de professionnels (coiffeurs, barbiers, estheticiennes, coachs...) gerent encore leurs RDV par telephone, SMS ou sur papier
- Les clients veulent reserver en ligne, 24/7, sans appeler
- Les solutions existantes (Planity, Doctolib) sont couteuses ou trop generiques
- Les independants et petites structures n'ont pas d'outil adapte ET abordable

## Slide 4 : La solution — CutBook
- Plateforme web de reservation en ligne adaptable a tout type de profession
- Modele organisation : chaque structure (salon, cabinet, studio...) = 1 organisation avec Owner + Members
- 3 interfaces adaptees : **Client** / **Member (professionnel)** / **Owner (gerant)**
- Reservation de creneaux en temps reel avec anti-double-booking
- Paiement en ligne integre (Stripe)
- Programme de fidelite (points + recompenses automatiques)
- Client libre : peut reserver dans n'importe quelle organisation via `/@nom-de-l-orga`

## Slide 5 : D'ou on part — La V1
- Projet de 2e annee avec Adil (repo : github.com/MrSamy91/rdv_plateform)
- Stack V1 : Python / Flask / SQLAlchemy / SQLite / Jinja2
- Features V1 : Auth, booking, dashboards client+coiffeur, emails, fidelite, avis
- **Limites identifiees :**
  - Jamais deploye (local uniquement)
  - UI basique (templates Jinja2 server-rendered)
  - Code monolithique (fichier routes.py de 1200+ lignes)
  - Aucun paiement en ligne
  - Salon unique, pas scalable
  - Secrets en clair dans le code source
  - Aucun SEO

## Slide 6 : V1 vs V2 — Ce qui change

| Aspect | V1 (Python/Flask) | V2 (Next.js) |
|---|---|---|
| Base de donnees | SQLite local | PostgreSQL cloud (Neon) + Docker local |
| Frontend | Jinja2 templates | React + Tailwind + shadcn/ui |
| Backend/API | Flask monolithique | tRPC type-safe + App Router |
| Typage | Python dynamique | TypeScript strict |
| Deploiement | Local uniquement | Vercel (CI/CD automatique) |
| Paiement | Aucun | Stripe Checkout |
| Organisation | Structure unique | Multi-organisation (Owner + Members) |
| Auth | Flask-Login basique | BetterAuth (email + Google OAuth) |
| SEO | Aucun | Optimise (metadata, SSR, sitemap, OpenGraph) |
| Dev local | SQLite fichier | Docker Compose (PostgreSQL) |

## Slide 7 : Learning Objectives
1. **Migration de stack**
   - Python/Flask vers TypeScript/Next.js
   - Equivalences : SQLAlchemy -> Prisma, Jinja2 -> React (JSX), Flask -> Next.js
2. **Architecture professionnelle**
   - Clean code, separation des responsabilites, API type-safe
   - Prisma ORM, tRPC (routers simples et maintenables), validation Zod
3. **DevOps & Deploiement**
   - Docker Compose pour le dev local (PostgreSQL)
   - Deploiement continu sur Vercel
   - Base de donnees cloud (Neon PostgreSQL)
   - Variables d'environnement, secrets securises
4. **Travail d'equipe structure**
   - Git Flow : feature branches -> dev -> main
   - Husky + lint-staged (pre-commit hooks stricts)
   - PR reviews systematiques
   - Kanban board pour le suivi des taches

## Slide 8 : Technologies utilisees
- **Framework** : Next.js 16 (App Router, Turbopack)
- **Langage** : TypeScript (strict mode)
- **ORM** : Prisma (migrations, type-safe queries)
- **API** : tRPC + TanStack Query v5
- **Auth** : BetterAuth (email/password + Google OAuth)
- **UI** : Tailwind CSS v4 + shadcn/ui (composants Radix)
- **Animations** : Framer Motion
- **Paiement** : Stripe Checkout + Webhooks
- **Emails** : React Email + Resend (emails transactionnels)
- **Calendrier** : FullCalendar
- **Dev local** : Docker Compose (PostgreSQL)
- **Quality** : Husky + lint-staged + ESLint + Prettier

## Slide 9 : Services tiers
| Service | Usage | Cout |
|---|---|---|
| **Stripe** | Paiement en ligne (checkout, webhooks) | Gratuit en mode test |
| **Resend** | Emails transactionnels (confirmation, rappel, annulation) | Free tier (100/jour) |
| **Neon** | PostgreSQL serverless (production) | Free tier |
| **Vercel** | Hosting & deploiement continu | Free tier (hobby) |
| **Docker** | PostgreSQL local (dev) | Gratuit |
| **Google OAuth** | Connexion sociale | Gratuit |
| **GitHub** | Versionning, collaboration, PR reviews | Gratuit |

## Slide 10 : Challenges identifies
1. **Integration Stripe** — Premiere experience pour Adil, Samy a des bases. Risque : complexite des webhooks et gestion des remboursements
2. **Anti-double-booking** — Gerer les reservations concurrentes en temps reel sans conflits (transaction Prisma)
3. **Calendrier interactif** — Vue calendrier FullCalendar pour les professionnels, UX complexe a implementer
4. **Travail d'equipe** — Premiere fois avec un vrai workflow Git Flow + Husky. Risque : conflits de merge, communication
5. **Modele organisation** — Concevoir un schema simple et maintenable pour gerer les structures pro comme des organisations (Owner + Members)
6. **Scope ambitieux** — Beaucoup de features en 27 jours. Mitigation : MVP d'abord, features bonus ensuite

## Slide 11 : Planning — 4 semaines
> Detail complet sur le board Kanban (Trello)

**Semaine 1 (5-11 mai)** — Fondations
- Setup projet + Docker, schema Prisma, auth BetterAuth, Husky, layout UI, deploy Vercel

**Semaine 2 (12-18 mai)** — Core Booking
- Systeme de reservation complet, calendrier membre, dashboards, emails Resend
- *>> Demo technique ~15 mai*

**Semaine 3 (19-25 mai)** — Features avancees
- Integration Stripe, programme fidelite, systeme d'avis
- *>> Demo blanche ~22 mai*

**Semaine 4 (26-29 mai)** — Polish & Demo
- Responsive, tests, bug fixes, SEO, preparation demo
- *>> DEMO DAY = 29 mai*

## Slide 12 : Mockups
[Wireframes des pages principales]
- Landing page / Page d'accueil
- Page organisation (`/@nom-de-l-orga`) avec membres, services, avis
- Flow de reservation (membre -> service -> creneau -> paiement Stripe)
- Dashboard client (mes RDV, historique, points fidelite)
- Dashboard membre (calendrier FullCalendar, gestion creneaux)
- Dashboard owner (stats, gestion organisation, membres)

## Slide 13 : Scope — IN vs OUT

### IN (Demo Day 29 mai)
- Auth (email + Google OAuth)
- Organisations (1 orga = 1 structure pro, Owner + Members)
- Booking complet (reservation, annulation, historique)
- Paiement Stripe
- Calendrier membre (FullCalendar)
- Programme fidelite
- Systeme d'avis/reviews
- Emails transactionnels (React Email + Resend)
- SEO optimise
- Deploy Vercel + Docker local

### OUT (V3 / Futur)
- Messagerie temps reel (tRPC/Convex)
- PayPal
- App mobile native
- Notifications push / SMS

## Slide 14 : Merci !
- **Repo** : github.com/MrSamy91/rdv_plateform (repo existant, migre)
- **Demo** : cutbook.vercel.app
- Des questions ?
