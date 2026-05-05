# Securite

## Variables d'environnement

- **Tous** les secrets dans `.env`, **JAMAIS** en dur dans le code.
- `.env*` est dans `.gitignore`.
- Template : `.env.example` (a copier en `.env`).

## Detection de secrets

- **secretlint** scanne les fichiers stages au pre-commit.
- Bloque les tokens AWS/GCP/Slack/GitHub/etc.
- ⚠️ Le repo a deja eu un password Gmail expose dans la V1 — ne reproduire pas l'erreur.

## Auth

- **BetterAuth** rate limiting actif (config native, voir `lib/auth/_config.ts`).
- Sessions HTTPOnly cookie (BetterAuth gere automatiquement).
- Validation pre-login dans le hook `before` de BetterAuth.

## Validation des inputs

- **Validation Zod cote serveur** sur tous les inputs externes :
  - tRPC procedures (input schemas)
  - Server Actions
  - API routes
- Ne **jamais** faire confiance au client.

## Stripe

- Webhooks **toujours verifies par signature** (`stripe.webhooks.constructEvent`) avant de modifier la BDD.
- Pas de logique business dans le webhook : juste idempotent (mark booking as paid, send email).

## Roles & permissions

- Verifies **cote serveur** (middleware tRPC), jamais cote client uniquement.
- Pattern : `protectedProcedure` pour user connecte, custom middleware pour role-based access.

## CSRF

- Protection native Next.js sur Server Actions.
- tRPC : utilise les memes mecanismes (headers + cookies).

## Donnees sensibles

- **Jamais** de PII dans les logs (`console.log`, Sentry, etc.).
- Hash des passwords delegues a BetterAuth (bcrypt natif).
- Tokens Stripe/Resend/etc. : reutiliser, ne jamais logger.
