# Onboarding — CutBook

> Bienvenue dans le projet ! Ce document est ton point d'entree pour comprendre **comment fonctionne le projet** et **pourquoi on a choisi chaque techno**.
> Lecture estimee : 25 min. Tu peux lire en diagonale au debut, et revenir aux sections precises quand tu codes.

---

## 1. Le projet en 30 secondes

**CutBook** est une plateforme de reservation en ligne adaptable a n'importe quelle profession (coiffeur, coach, esthetique, medecin, etc.). C'est la **V2** d'un projet qu'on avait fait en Python/Flask (la V1 est archivee sur la branche `legacy/v1-python-flask`).

L'idee centrale : chaque structure (un salon, un cabinet, etc.) est une **Organisation** qui a un Owner (le proprietaire) et des Members (les pros). Les clients peuvent reserver via une URL `/@nom-de-l-orga`.

Stack moderne, deploye sur Vercel, BDD PostgreSQL Neon, paiement Stripe.

**Pour le visuel et le pitch deck complet** : ouvre `docs/presentation.html` dans ton navigateur.

---

## 2. Demarrer en local (5 min)

```bash
# 1. Cloner le repo
git clone https://github.com/MrSamy91/rdv_plateform.git
cd rdv_plateform

# 2. Installer les deps (pnpm uniquement, pas npm)
pnpm install

# 3. Copier le template d'env et le remplir
cp .env.example .env
# (demande a Samy les credentials Neon/Stripe/Resend pour le dev)

# 4. Lancer la BDD locale (Docker)
docker compose up -d

# 5. Generer le client Prisma + appliquer le schema
pnpm prisma generate
pnpm prisma db push

# 6. Lancer le dev server
pnpm dev
```

Tu devrais avoir le site sur `http://localhost:3000`.

---

## 3. La stack — le pourquoi de chaque choix

### Frontend

**Next.js 16 (App Router)** — _Le framework React_

- Server Components par defaut → les pages sont rendues cote serveur (rapide, SEO friendly).
- App Router = le routing moderne de Next.js (basé sur dossiers).
- On utilise Turbopack pour le dev (build 10× plus rapide que Webpack).
- ⚠️ Cette version a des **breaking changes** par rapport aux versions anterieures.

**TypeScript strict** — _Le langage_

- TS empeche 80% des bugs avant qu'ils n'arrivent en prod.
- Mode strict + `noUncheckedIndexedAccess` → tu ne peux pas acceder `array[0]` sans gerer le `undefined`.
- Pas de `any` autorise. Si tu hesites sur un type, utilise `unknown` puis narrow.

**Tailwind CSS v4** — _Le styling_

- Classes utilitaires (`flex`, `bg-green-500`, `p-4`...). Pas de fichier CSS separe par composant.
- v4 est plus rapide et utilise les CSS variables natives.
- **Ne jamais hardcoder une couleur** : tout passe par les variables definies dans `app/globals.css` (palette Sanzo Wada).

**shadcn/ui** — _Les composants UI_

- Pas une lib classique : tu copies les composants dans ton repo (`components/ui/`).
- Base sur Radix UI (accessibilite native) + Tailwind.
- Quand tu as besoin d'un Button, Dialog, Form, etc., tu fais `pnpm dlx shadcn@latest add button`.

**Framer Motion** — _Les animations_

- Pour les anims complexes (transitions de pages, listes animees, drag & drop).
- Si c'est juste un hover, utilise Tailwind transitions (plus leger).

**Lucide React** — _Les icones_

- Lib d'icones outline modernes (genre les icones partout dans le pitch).
- Import : `import { Calendar } from 'lucide-react'`.

**FullCalendar** — _Le calendrier_

- Pour le dashboard membre : afficher les RDV, draguer pour deplacer, etc.
- Vue semaine/mois interactive.

**SwiperJS** — _Les carousels_

- Pour les sliders type "membres de l'orga", "services", etc.

**React Hook Form + Zod** — _Les formulaires_

- RHF gere l'etat du formulaire (sans rerender tout l'arbre).
- Zod valide les inputs (cote client ET serveur — meme schema partage).

### Backend

**tRPC + TanStack Query v5** — _L'API type-safe_

- tRPC permet d'appeler des fonctions serveur depuis le client **comme si c'etaient des fonctions locales**, avec types end-to-end.
- Plus besoin d'OpenAPI/REST/GraphQL. Tu definis une procedure cote serveur, et tu l'appelles cote client avec autocomplete.
- TanStack Query = cache, refetch, optimistic updates → la couche client de tRPC.
- Convention : 1 router par domaine metier (`organization.ts`, `booking.ts`, etc.).

**Prisma** — _L'ORM_

- Schema declare dans `prisma/schema.prisma` → genere un client TS type-safe.
- `pnpm prisma generate` apres chaque changement de schema.
- `pnpm prisma db push` pour appliquer le schema en dev (sans migration). En prod, on utilise `prisma migrate`.

**PostgreSQL** — _La BDD_

- Production : Neon (serverless, scale auto, branch DBs comme git).
- Dev : Docker Compose (un container `postgres:16-alpine` local).

**BetterAuth** — _L'auth_

- Plus moderne et plus customizable que NextAuth.
- Email + password + Google OAuth.
- Rate limiting natif. Hooks `before`/`after` pour des checks custom.
- ⚠️ Tout le code auth dans `lib/auth/` (voir AGENTS.md). Server et client dans des fichiers separes (contrainte `'use client'`).

**Stripe** — _Le paiement_

- Stripe Checkout (page hostee par Stripe) + Webhooks (Stripe nous notifie quand le paiement reussit).
- On verifie la signature des webhooks (sinon n'importe qui pourrait nous envoyer un faux event).

**React Email + Resend** — _Les emails_

- React Email = on ecrit les templates en JSX (`<Email><Heading>...</Heading></Email>`).
- Resend = le service qui envoie (genre Mailgun mais moderne).

**Zod** — _La validation_

- Validation runtime + types compile-time.
- Utilise sur tRPC (input validation), RHF (form validation), .env parsing.

### Infra & DX

**Docker Compose** — _Dev local_

- `docker compose up -d` lance PostgreSQL en local.
- Pas besoin d'installer Postgres sur ta machine.

**Vercel** — _Hosting_

- Push sur `main` → deploy auto.
- Push sur une autre branche → preview deployment (URL unique pour tester).
- Gratuit jusqu'a un certain trafic.

**Husky + lint-staged + commitlint** — _Qualite de code_

- Husky lance des hooks Git automatiquement.
- `pre-commit` : verifie que le code lint, qu'il y a pas de secret en clair, que les tests des fichiers modifies passent.
- `commit-msg` : verifie que le message respecte Conventional Commits + max 5 mots.
- `pre-push` : typecheck + lint + tests + build avant de push (impossible de push du code qui ne build pas).
- Ces verifications **t'evitent de casser le main**.

**ESLint + Prettier** — _Lint & format_

- ESLint = detecte les bugs et bad practices.
- Prettier = formate le code automatiquement (semi: false, single quotes, etc.).
- Auto-applique au pre-commit, donc tu n'as rien a faire.

**Vitest + Testing Library** — _Tests_

- Vitest = Jest mais 5× plus rapide (basé sur Vite).
- Testing Library = on teste les composants comme un user les utiliserait (pas l'implementation).
- Convention : `monfichier.test.ts` a cote de `monfichier.ts`.

**secretlint** — _Detection de secrets_

- Scanne les fichiers stages au commit pour detecter les tokens AWS/GCP/Slack/etc.
- Empeche de commit accidentellement un `.env` ou une cle API en clair.
- ⚠️ Le repo a deja eu un password Gmail expose dans la V1 — ne reproduis pas l'erreur.

---

## 4. Workflow Git — comment on bosse

### Les branches

- `main` : prod. **Tu ne commits jamais directement** (bloque par Husky).
- `dev` : integration des features. **Idem, pas de commit direct**.
- Tu crees une branche `feat/ma-feature`, tu bosses, tu push, tu fais une PR vers `dev`.

### Conventions de nommage de branche

- `feat/<nom>` : nouvelle feature (ex: `feat/booking-flow`)
- `fix/<nom>` : bug fix
- `docs/<nom>` : documentation
- `chore/<nom>` : maintenance, deps
- `refactor/<nom>` : refactoring sans changement de comportement
- `test/<nom>` : ajout de tests
- `setup/<nom>` : config initiale

### Conventions de commit (Conventional Commits franglish)

- Format : `<type>: <message court>`
- Max 5 mots dans le message.
- Exemples : `feat: add booking flow`, `fix: stripe webhook signature`, `chore: update deps`.
- Le hook `commit-msg` te bloque si tu ne respectes pas.

### Cycle complet

```bash
# 1. Partir de dev a jour
git checkout dev && git pull

# 2. Creer ta branche
git checkout -b feat/ma-feature

# 3. Coder, commiter (souvent, petits commits)
git add <fichiers>
git commit -m "feat: add login form"

# 4. Push (lance pre-push : typecheck + lint + test + build)
git push -u origin feat/ma-feature

# 5. Ouvrir une PR sur GitHub vers dev
# 6. Apres review, merge dans dev
# 7. Quand dev est stable, merge dans main → deploy auto Vercel
```

---

## 5. Convention de code

### Naming des fichiers — kebab-case PARTOUT

- Composants : `hero-section.tsx` (export `HeroSection`)
- Hooks : `use-auth.ts` (export `useAuth`)
- Utils : `format-price.ts` (export `formatPrice`)

### Server Components vs Client Components

- Tout est Server Component **par defaut** dans Next.js App Router.
- Tu mets `"use client"` UNIQUEMENT si tu as besoin de :
  - `useState`, `useEffect`, `useRef`, etc.
  - Event handlers (`onClick`, `onChange`...)
  - Browser API (`window`, `localStorage`...)
- Pourquoi ? Server Components = pas de JS envoye au client, page plus rapide.

### Validation

- TOUT input externe est valide avec **Zod** : tRPC procedures, forms, API routes.
- Roles/permissions : toujours verifies cote serveur (middleware tRPC).

### Pas de duplication

- Avant de creer un composant ou util, **cherche s'il existe deja**.
- Si tu as 3 lignes similaires, peut-etre OK. Si tu as 30 lignes dupliquees, factorise.

---

## 6. Documents de reference

- **`AGENTS.md`** (a la racine) — regles strictes pour agents IA et devs. Source de verite des conventions.
- **`docs/03-architecture.md`** — architecture technique + schema Prisma complet.
- **`docs/charte-graphique.html`** — design system visuel (palette, typo, composants).
- **`docs/presentation.html`** — pitch deck du projet (a presenter le 29 mai).

---

## 7. Si tu galeres

1. **Re-lire `AGENTS.md` et la section concernee** ici.
2. **Context7 MCP server** : pour avoir la doc a jour d'une lib (Next.js 16 a des breaking changes que pas tous les outils connaissent).
3. **Demander a Samy** sur Discord/IRL.

Bienvenue, et bon code 🚀
