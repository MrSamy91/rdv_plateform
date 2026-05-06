# CutBook — Architecture Technique

## Vue d'ensemble

```
                    +------------------+
                    |    Client Web    |
                    |  (Next.js SSR +  |
                    |   React Client)  |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   Vercel Edge    |
                    |   (Hosting)      |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v---+  +------v------+  +----v-------+
     |  App Router |  |   tRPC API  |  | BetterAuth |
     |  (SSR/SSG)  |  |  (type-safe)|  |  (Auth)    |
     +--------+----+  +------+------+  +----+-------+
              |              |              |
              +--------------+--------------+
                             |
                    +--------v---------+
                    |   Prisma ORM     |
                    |  (Type-safe DB)  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------v---------+       +-----------v--------+
     |  Neon PostgreSQL  |       |  Docker PostgreSQL  |
     |  (Production)     |       |  (Dev local)        |
     +------------------+       +--------------------+

Services externes :
  - Stripe (paiement)
  - React Email + Resend (emails)
  - Google OAuth (auth sociale)
```

## Modele Organisation

```
Organisation (structure pro : salon, cabinet, studio, etc.)
  |
  +-- Owner (1 user, role OWNER)
  |     -> Gere l'organisation, les services, les membres, les stats
  |
  +-- Members (N users, role MEMBER)
  |     -> Professionnels, gerent leurs creneaux et RDV
  |
  +-- Services (N services propres a l'orga)
  +-- TimeSlots (creneaux de chaque membre)

Client (role CLIENT)
  -> Independant, peut reserver dans n'importe quelle orga
  -> Accede aux organisations via /@slug
```

## Schema Prisma (simplifie et maintenable)

```prisma
// === Auth (gere par BetterAuth) ===
// Les tables user, session, account, verification sont gerees par BetterAuth
// On etend le user avec nos champs custom

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  phone         String?
  role          Role      @default(CLIENT)
  loyaltyPoints Int       @default(0)
  createdAt     DateTime  @default(now())

  // Relations
  bookings      Booking[]
  reviews       Review[]
  rewards       Reward[]
  ownedOrg      Organization? @relation("OrgOwner")
  membership    Member?
}

enum Role {
  CLIENT
  OWNER
  MEMBER
}

// === Organisation (= 1 Salon) ===

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique   // pour /@slug
  address     String
  phone       String
  description String?
  imageUrl    String?
  createdAt   DateTime @default(now())

  // Relations
  ownerId     String   @unique
  owner       User     @relation("OrgOwner", fields: [ownerId], references: [id])
  members     Member[]
  services    Service[]
}

model Member {
  id          String   @id @default(cuid())
  userId      String   @unique
  orgId       String
  specialties String?
  bio         String?
  experience  Int      @default(0)

  // Relations
  user        User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [orgId], references: [id])
  timeSlots   TimeSlot[]
  bookings    Booking[]
  reviews     Review[]
}

// === Services ===

model Service {
  id          String   @id @default(cuid())
  orgId       String
  name        String
  description String?
  duration    Int      // en minutes
  price       Float

  // Relations
  organization Organization @relation(fields: [orgId], references: [id])
  bookings     Booking[]
}

// === Creneaux ===

model TimeSlot {
  id          String   @id @default(cuid())
  memberId    String
  date        DateTime @db.Date
  startTime   String   // "09:00"
  endTime     String   // "09:30"
  isAvailable Boolean  @default(true)

  // Relations
  member      Member   @relation(fields: [memberId], references: [id])
  booking     Booking?
}

// === Reservations ===

model Booking {
  id              String        @id @default(cuid())
  clientId        String
  memberId        String
  serviceId       String
  timeSlotId      String        @unique
  status          BookingStatus @default(PENDING)
  totalPrice      Float
  stripePaymentId String?
  createdAt       DateTime      @default(now())
  completedAt     DateTime?

  // Relations
  client     User     @relation(fields: [clientId], references: [id])
  member     Member   @relation(fields: [memberId], references: [id])
  service    Service  @relation(fields: [serviceId], references: [id])
  timeSlot   TimeSlot @relation(fields: [timeSlotId], references: [id])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

// === Avis ===

model Review {
  id          String   @id @default(cuid())
  clientId    String
  memberId    String
  rating      Int      // 1-5
  comment     String?
  createdAt   DateTime @default(now())

  // Relations
  client      User   @relation(fields: [clientId], references: [id])
  member      Member @relation(fields: [memberId], references: [id])
}

// === Fidelite ===

model Reward {
  id             String       @id @default(cuid())
  clientId       String
  type           String       // "free_haircut", "discount_20"
  status         RewardStatus @default(AVAILABLE)
  expirationDate DateTime
  usedAt         DateTime?
  createdAt      DateTime     @default(now())

  // Relations
  client         User @relation(fields: [clientId], references: [id])
}

enum RewardStatus {
  AVAILABLE
  USED
  EXPIRED
}
```

## Structure du projet (repo existant : rdv_plateform)

```
rdv_plateform/              # Repo existant, migre vers Next.js
  docker-compose.yml        # PostgreSQL local
  .husky/                   # Git hooks (pre-commit, commit-msg)
  src/
    app/                    # Next.js App Router
      (public)/             # Routes publiques
        page.tsx            # Landing page
        login/page.tsx
        register/page.tsx
        @[slug]/page.tsx    # Page organisation (/@nom-de-l-orga)
      (dashboard)/          # Routes protegees
        client/
          page.tsx          # Dashboard client
          bookings/page.tsx
          rewards/page.tsx
        member/
          page.tsx          # Dashboard membre (professionnel)
          calendar/page.tsx # FullCalendar
          availability/page.tsx
        owner/
          page.tsx          # Dashboard owner (gerant de l'orga)
          services/page.tsx
          members/page.tsx
          stats/page.tsx
      api/
        trpc/[trpc]/route.ts
        auth/[...all]/route.ts
        stripe/webhook/route.ts
      layout.tsx
    lib/
      auth/                 # Module auth (BetterAuth)
        index.ts
        client.ts
        _config.ts
      trpc/
        index.ts
        routers/            # Routers simples, 1 fichier = 1 domaine
          organization.ts   # CRUD orga + slug
          booking.ts        # Reserver, annuler, lister
          service.ts        # CRUD services
          member.ts         # Gestion membres
          review.ts         # Avis
          reward.ts         # Fidelite
      stripe/
        index.ts
        checkout.ts
        webhook.ts
      email/
        index.ts            # Resend config
        templates/          # React Email templates
      db.ts                 # Prisma client
    components/
      ui/                   # shadcn/ui
      layout/               # Navbar, Sidebar, Footer
      booking/              # Composants reservation
      calendar/             # Composants FullCalendar
      dashboard/            # Composants dashboard
  prisma/
    schema.prisma
    seed.ts
  .env.example
  package.json
  tsconfig.json
```

## Docker Compose (dev local)

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: cutbook
      POSTGRES_PASSWORD: cutbook
      POSTGRES_DB: cutbook
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```env
# .env (dev local)
DATABASE_URL="<postgres-dev-url>"

# .env (production — Neon)
DATABASE_URL="<postgres-neon-url>"
```

## Flux de reservation

```
Client                    Next.js                 tRPC API              Prisma/DB           Stripe
  |                          |                       |                     |                  |
  |-- Visite /@orga --------->|                       |                     |                  |
  |<- Page orga (SSR) ------|-- getOrg(slug) ------>|-- query Org ------->|                  |
  |-- Choix membre --------->|                       |                     |                  |
  |<- Creneaux dispos ------|-- getAvailableSlots -->|-- query TimeSlot -->|                  |
  |-- Choix service -------->|                       |                     |                  |
  |-- Confirmer ------------>|-- createBooking ----->|-- transaction ----->|                  |
  |                          |                       |   insert Booking    |                  |
  |                          |                       |   lock TimeSlot     |                  |
  |                          |-- createCheckout ---->|                     |-- Session ------>|
  |<- Redirect Stripe ------|                       |                     |                  |
  |-- Paiement ------------->|                       |                     |----------------->|
  |                          |<- Webhook success ----|---------------------|<-- Event --------|
  |                          |-- updateBooking ----->|-- status=CONFIRMED->|                  |
  |                          |-- sendEmail --------->| (React Email)      |                  |
  |<- Email confirmation ----|                       |                     |                  |
```

## Husky + Qualite de code

```
.husky/
  pre-commit    -> lint-staged (ESLint + Prettier sur fichiers stages)
  commit-msg    -> commitlint (format conventional commits)

lint-staged config:
  "*.{ts,tsx}" -> eslint --fix && prettier --write
  "*.{json,md}" -> prettier --write

commitlint config:
  type: feat, fix, docs, style, refactor, perf, chore
  max header length: 72
```

## Securite

- Variables d'env pour tous les secrets (.env, jamais en dur)
- BetterAuth avec rate limiting integre
- Validation Zod sur tous les inputs tRPC
- CSRF protection native Next.js
- Stripe webhooks verifies par signature
- Roles & permissions verifies cote serveur (middleware tRPC)
- Husky pre-commit : empeche le code non-lint de passer
