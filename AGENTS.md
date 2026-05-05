<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — CutBook

> Instructions pour tout agent IA (Claude, Cursor, Copilot, etc.) bossant sur ce repo.
> Les regles detaillees sont dans `.claude/rules/` (modulaires, par categorie).
> **Lire au minimum** : `stack.md`, `naming.md`, `structure.md`, `workflow-git.md`.

## Index des rules

| Categorie         | Fichier                                                                | Quand lire                           |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| **Stack**         | [`.claude/rules/stack.md`](.claude/rules/stack.md)                     | Toujours en premier                  |
| **Naming**        | [`.claude/rules/naming.md`](.claude/rules/naming.md)                   | Avant de creer un fichier            |
| **Structure**     | [`.claude/rules/structure.md`](.claude/rules/structure.md)             | Avant de placer un fichier           |
| **Auth**          | [`.claude/rules/auth-pattern.md`](.claude/rules/auth-pattern.md)       | Toute modif liee a l'auth            |
| **Code style**    | [`.claude/rules/code-style.md`](.claude/rules/code-style.md)           | Toujours en codant                   |
| **SEO & perf**    | [`.claude/rules/seo-performance.md`](.claude/rules/seo-performance.md) | Pages publiques                      |
| **Workflow Git**  | [`.claude/rules/workflow-git.md`](.claude/rules/workflow-git.md)       | Avant chaque commit/push             |
| **Securite**      | [`.claude/rules/security.md`](.claude/rules/security.md)               | Toute manipulation d'inputs externes |
| **Tests**         | [`.claude/rules/tests.md`](.claude/rules/tests.md)                     | Quand on ajoute des tests            |
| **Design system** | [`.claude/rules/design-system.md`](.claude/rules/design-system.md)     | Composants UI / styling              |

## Documentation projet

| Doc                                                                | Pour qui                                       |
| ------------------------------------------------------------------ | ---------------------------------------------- |
| [`docs/onboarding.md`](docs/onboarding.md)                         | Nouveau dev (pedagogique, 25 min de lecture)   |
| [`docs/03-architecture.md`](docs/03-architecture.md)               | Architecture technique + schema Prisma         |
| [`docs/charte-graphique.html`](docs/charte-graphique.html)         | Design system visuel                           |
| [`docs/01-slide-deck.md`](docs/01-slide-deck.md)                   | Pitch deck du projet                           |
| [`docs/02-planning-4-semaines.md`](docs/02-planning-4-semaines.md) | Planning sprints                               |
| [`docs/presentation.html`](docs/presentation.html)                 | Pitch deck visuel (a presenter le 29 mai 2026) |

## TL;DR pour demarrer rapidement

1. **Stack** : Next.js 16, TypeScript strict, Prisma 7, tRPC, BetterAuth, Tailwind v4, shadcn/ui — voir `stack.md`
2. **Package manager** : `pnpm` exclusivement (jamais npm/npx/yarn)
3. **Naming fichiers** : kebab-case **partout** (composants, hooks, utils, types)
4. **Branches** : jamais commit direct sur `main`/`dev`, toujours via `feat/<nom>` + PR
5. **Commits** : Conventional Commits franglish, max 5 mots, pas de mention Claude/Anthropic
6. **Server Components par defaut**, `"use client"` uniquement si necessaire
7. **Validation Zod cote serveur** sur tous les inputs externes
8. **Avant un fix de lib** : utiliser Context7 MCP (docs a jour)
