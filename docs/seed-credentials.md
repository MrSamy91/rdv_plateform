# Comptes de démo — Seed CutBook

> Tous les comptes ci-dessous sont créés par `pnpm db:seed`.
> Mot de passe commun : **`CutBookDemo123!`** (override possible via `SEED_USER_PASSWORD`).
> Tous les emails sont en `@cutbook.test` (Mailpit catch-all en dev → http://localhost:8025).

---

## 1. Owners (6)

| Email                   | Mot de passe      | Nom             | Organisation                      | URL publique                                                            |
| ----------------------- | ----------------- | --------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `owner@cutbook.test`    | `CutBookDemo123!` | Nora Benali     | **Atelier Nova** (coiffure)       | [`/@atelier-nova`](http://localhost:3000/@atelier-nova)                 |
| `karim@cutbook.test`    | `CutBookDemo123!` | Karim Aziz      | **Barbershop Le Refuge**          | [`/@barbershop-le-refuge`](http://localhost:3000/@barbershop-le-refuge) |
| `sophie@cutbook.test`   | `CutBookDemo123!` | Sophie Lambert  | **Institut Lumière** (esthétique) | [`/@institut-lumiere`](http://localhost:3000/@institut-lumiere)         |
| `lena@cutbook.test`     | `CutBookDemo123!` | Lena Vidal      | **Onyx Nail Bar**                 | [`/@onyx-nail-bar`](http://localhost:3000/@onyx-nail-bar)               |
| `thomas@cutbook.test`   | `CutBookDemo123!` | Thomas Rivière  | **Maison Zenza** (spa massage)    | [`/@maison-zenza`](http://localhost:3000/@maison-zenza)                 |
| `mathilde@cutbook.test` | `CutBookDemo123!` | Mathilde Vernet | **Encre Noire Tatouage**          | [`/@encre-noire`](http://localhost:3000/@encre-noire)                   |

---

## 2. Membres par organisation

### Atelier Nova — 4 membres

| Email                       | Nom           | Spécialités                    |
| --------------------------- | ------------- | ------------------------------ |
| `mila@cutbook.test`         | Mila Laurent  | Coupe femme, balayage, couleur |
| `leo@cutbook.test`          | Leo Martin    | Coupe homme, barbe, express    |
| `yasmine.nova@cutbook.test` | Yasmine Petit | Coloration, balayage           |
| `hugo.nova@cutbook.test`    | Hugo Faure    | Coupe homme, barbe             |

### Barbershop Le Refuge — 4 membres

| Email                              | Nom            | Spécialités                        |
| ---------------------------------- | -------------- | ---------------------------------- |
| `anthony.barbershop@cutbook.test`  | Anthony Moreau | Coupe classique, dégradé américain |
| `bilal.barbershop@cutbook.test`    | Bilal Mansouri | Coupe + barbe, soin                |
| `jonathan.barbershop@cutbook.test` | Jonathan Rey   | Rasage à l'ancienne, taille barbe  |
| `reda.barbershop@cutbook.test`     | Reda Khaldi    | Coupe homme, coloration            |

### Institut Lumière — 4 membres

| Email                           | Nom              | Spécialités                    |
| ------------------------------- | ---------------- | ------------------------------ |
| `emilie.institut@cutbook.test`  | Emilie Garnier   | Soins visage, anti-âge         |
| `aurelie.institut@cutbook.test` | Aurelie Da Silva | Massages, drainage lymphatique |
| `fatou.institut@cutbook.test`   | Fatou Ndiaye     | Manucure, pédicure, nail art   |
| `lea.institut@cutbook.test`     | Lea Brunet       | Maquillage, épilations         |

### Onyx Nail Bar — 3 membres

| Email                         | Nom                | Spécialités                     |
| ----------------------------- | ------------------ | ------------------------------- |
| `soraya.onyx@cutbook.test`    | Soraya Belkacem    | Gel, nail art                   |
| `justine.onyx@cutbook.test`   | Justine Roy        | French manucure, semi-permanent |
| `priscilla.onyx@cutbook.test` | Priscilla Da Costa | Capsules, allongement           |

### Maison Zenza — 4 membres

| Email                         | Nom             | Spécialités              |
| ----------------------------- | --------------- | ------------------------ |
| `akira.maison@cutbook.test`   | Akira Yamamoto  | Shiatsu, thaï            |
| `camille.maison@cutbook.test` | Camille Berger  | Prénatal, réflexologie   |
| `mathieu.maison@cutbook.test` | Mathieu Olivier | Suédois, pierres chaudes |
| `nadia.maison@cutbook.test`   | Nadia Boucher   | Soins signature, rituels |

### Encre Noire Tatouage — 3 membres

| Email                      | Nom           | Spécialités             |
| -------------------------- | ------------- | ----------------------- |
| `theo.encre@cutbook.test`  | Theo Maillard | Réalisme, portrait      |
| `manon.encre@cutbook.test` | Manon Lemoine | Fine line, botanique    |
| `soren.encre@cutbook.test` | Soren Karlsen | Old school, traditional |

> Total : **22 membres** sur 6 organisations.

---

## 3. Clients

### Comptes nominatifs (avec historique fixe)

| Email                 | Nom            | Loyalty     | Particularité                                              |
| --------------------- | -------------- | ----------- | ---------------------------------------------------------- |
| `client@cutbook.test` | Camille Durand | **120 pts** | A 1 booking CONFIRMED + 1 reward AVAILABLE (`discount_20`) |
| `ines@cutbook.test`   | Ines Robert    | **40 pts**  | A 1 booking COMPLETED + 1 reward USED (`free_care`)        |

### Clients additionnels (38, générés)

38 clients avec des emails de la forme `<prénom>-<n>@cutbook.test` (ex: `lea-12@cutbook.test`).

Bookings & loyalty points sont distribués aléatoirement mais de manière **reproductible** (RNG seedé) :

- Statistiquement chaque client a entre 1 et 6 bookings
- 30% ont une reward (mix AVAILABLE / USED)
- Loyalty points = 10 × nb de bookings COMPLETED

> Pour lister les 38 emails après seed : `select email from "user" where email like '%@cutbook.test' and email like '%-_%@%'` dans Prisma Studio (`pnpm db:studio`).

---

## 4. Données pré-existantes (IDs stables, core seed)

Utilisables pour des tests manuels reproductibles (les tests d'intégration s'appuient dessus, **ne pas renommer**) :

| ID                       | Description                                 |
| ------------------------ | ------------------------------------------- |
| `seed-org-atelier-nova`  | Orga principale                             |
| `seed-org-refuge`        | Barbershop Le Refuge                        |
| `seed-org-lumiere`       | Institut Lumière                            |
| `seed-org-onyx`          | Onyx Nail Bar                               |
| `seed-org-zenza`         | Maison Zenza                                |
| `seed-org-encre`         | Encre Noire Tatouage                        |
| `seed-member-mila`       | Mila Laurent (Atelier Nova)                 |
| `seed-member-leo`        | Leo Martin (Atelier Nova)                   |
| `seed-service-cut`       | Coupe & brushing (55 €)                     |
| `seed-service-color`     | Balayage signature (145 €)                  |
| `seed-service-beard`     | Coupe homme & barbe (42 €)                  |
| `seed-booking-confirmed` | RDV de Camille avec Mila (J+1)              |
| `seed-booking-completed` | RDV passé d'Ines avec Leo (J-2)             |
| `seed-reward-available`  | Reward `discount_20` de Camille (AVAILABLE) |
| `seed-reward-used`       | Reward `free_care` d'Ines (USED)            |

---

## 5. Scénarios de test rapide

### Tester le booking public (parcours client invité)

1. Navigation incognito → http://localhost:3000/@atelier-nova
2. Choisir un service + membre + créneau libre
3. Optionnel : créer un compte ou login client existant

### Tester le dashboard owner

1. Login : `owner@cutbook.test`
2. URL : `/owner` → vue calendrier équipe + statistiques
3. Sous-pages : `/owner/services`, `/owner/members`, `/owner/agenda`

### Tester le recrutement de membre

1. Login owner → `/owner/members`
2. Inviter un email d'un client (ex: `lea-12@cutbook.test`)
3. Login en parallèle avec cet email → notification d'invitation
4. Accepter → bascule en membre de l'orga

### Tester le paiement Stripe (mode test)

1. Login client → réserver un RDV
2. Cliquer "Payer maintenant" sur la confirmation
3. Utiliser la carte test Stripe : `4242 4242 4242 4242` (exp future, CVC libre)
4. Le webhook met à jour le statut Payment via Mailpit

### Tester un dashboard riche

- Login `karim@cutbook.test` (owner Refuge) → planning chargé + historique avis
- Login `client@cutbook.test` → page "Mes RDV" avec passé/futur + loyalty + rewards

---

## 6. Volumétrie cible

| Entité           | Quantité |
| ---------------- | -------- |
| Organisations    | **6**    |
| Owners           | **6**    |
| Membres          | **22**   |
| Clients          | **40**   |
| Services         | **38**   |
| TimeSlots        | **~700** |
| Bookings         | **~150** |
| Paiements Stripe | **~75**  |
| Avis             | **~75**  |
| Rewards          | **~13**  |

---

## 7. Outils utiles

| Action                    | Commande                                         |
| ------------------------- | ------------------------------------------------ |
| Reset complet de la BDD   | `pnpm db:push --force-reset` puis `pnpm db:seed` |
| Reset + migrations + seed | `pnpm db:reset`                                  |
| Voir les données          | `pnpm db:studio` → http://localhost:5555         |
| Voir les emails envoyés   | http://localhost:8025 (Mailpit)                  |
| Dev server                | `pnpm dev` → http://localhost:3000               |
