# Structure du projet (sans `src/`)

```
.
├── app/                       # Next.js App Router
│   ├── (public)/              # Routes publiques (groupes)
│   │   ├── page.tsx           # Landing
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── @[slug]/page.tsx   # Page orga (/@nom-orga)
│   ├── (dashboard)/           # Routes protegees
│   │   ├── client/
│   │   ├── member/
│   │   └── owner/
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts
│   │   ├── auth/[...all]/route.ts
│   │   └── stripe/webhook/route.ts
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── auth/                  # Module BetterAuth (voir 04-auth-pattern.md)
│   ├── trpc/
│   │   ├── init.ts
│   │   ├── client.tsx
│   │   └── routers/           # 1 fichier = 1 domaine
│   ├── stripe/
│   ├── email/
│   ├── utils.ts               # cn() + helpers
│   └── db.ts                  # Prisma client (singleton)
├── components/
│   ├── ui/                    # shadcn/ui
│   ├── layout/
│   ├── booking/
│   ├── calendar/
│   └── dashboard/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── docs/                      # Documentation projet (pitch, onboarding, etc.)
├── .claude/rules/             # Rules pour les agents IA (toi)
└── ...
```

## Conventions par dossier

- `app/` : routes Next.js uniquement. Pas de logique metier ici, juste de l'orchestration (call tRPC, render composants).
- `lib/` : code metier reutilisable (auth, db, trpc, stripe, email, utils).
- `components/` : composants UI reutilisables. Sous-dossiers par domaine.
- `prisma/` : schema + migrations + seed.
