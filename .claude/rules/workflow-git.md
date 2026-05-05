# Workflow Git

## Branches

- `main` : production. **Aucun commit direct** (bloque par Husky pre-commit).
- `dev` : integration. **Aucun commit direct**.
- `legacy/<nom>` : branches archive (ex: `legacy/v1-python-flask`).
- `<type>/<nom>` ou `<type>-<nom>` avec types : `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`, `revert`, `build`, `style`, `setup`.

## Commits — Conventional Commits franglish

- Format : `<type>: <subject>` ou `<type>(<scope>): <subject>`
- Subject : **max 5 mots**, en franglish, minuscules.
- **JAMAIS** mentionner Claude, Anthropic, ou tout tiers dans le commit (pas de `Co-Authored-By`).

### Exemples valides

```
feat: add booking flow
fix: stripe webhook signature
chore: update deps
docs: add agent rules
refactor: trpc routers
```

### Exemples interdits

```
feat: ajoute le flow de reservation complet pour les clients     ❌ trop long
Add booking flow                                                  ❌ pas de type
feat: add booking — Co-Authored-By: Claude                       ❌ mention tier
```

## Husky hooks (configures, ne pas modifier sans raison)

| Hook                 | Action                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `pre-commit`         | no-commit-on-main/dev → secretlint → eslint --fix + prettier + vitest related (sur fichiers stages) |
| `commit-msg`         | max 5 mots subject → commitlint Conventional Commits                                                |
| `prepare-commit-msg` | auto-prefix `(#numero)` si la branche contient un nombre                                            |
| `pre-push`           | branch naming → typecheck → lint → test → build                                                     |
| `post-merge`         | auto `pnpm install` si `package.json` ou `pnpm-lock.yaml` ont change                                |

## Cycle complet

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
