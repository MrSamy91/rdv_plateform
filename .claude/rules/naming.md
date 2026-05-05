# Naming conventions — kebab-case PARTOUT

**Tous** les noms de fichiers sont en kebab-case (minuscules + tirets), peu importe leur type.

| Type         | Fichier                                  | Export interne                  |
| ------------ | ---------------------------------------- | ------------------------------- |
| Composant    | `hero-section.tsx`                       | `export function HeroSection()` |
| Hook         | `use-auth.ts`                            | `export function useAuth()`     |
| Utilitaire   | `format-price.ts`                        | `export function formatPrice()` |
| Types        | `user-types.ts`                          | `export type User`              |
| Page Next.js | `app/dashboard/page.tsx` (dossier kebab) | —                               |
| API route    | `app/api/stripe/webhook/route.ts`        | —                               |

L'export interne respecte la convention JS standard (PascalCase pour composants/types, camelCase pour fonctions/hooks). **Seul le nom de fichier est en kebab-case.**

## Exemples valides

```
components/booking/booking-form.tsx     → export function BookingForm
hooks/use-current-org.ts                → export function useCurrentOrg
lib/utils/format-price.ts               → export function formatPrice
lib/types/booking-types.ts              → export type Booking
app/(public)/login/page.tsx             → page Next.js
```

## Exemples interdits

```
components/BookingForm.tsx              ❌ PascalCase fichier
hooks/useAuth.ts                        ❌ camelCase fichier
lib/utils/formatPrice.ts                ❌ camelCase fichier
```
