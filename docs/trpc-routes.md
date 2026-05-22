# Routes tRPC

Reference simple des routeurs tRPC metier disponibles dans `lib/trpc/routers/`.

## Vue D'ensemble

| Routeur        | Role                                              | Fichier                         |
| -------------- | ------------------------------------------------- | ------------------------------- |
| `booking`      | Confirmer et annuler une reservation              | `lib/trpc/routers/booking.ts`   |
| `service`      | Gerer les prestations d'un salon                  | `lib/trpc/routers/service.ts`   |
| `timeSlot`     | Gerer les creneaux et verifier leur disponibilite | `lib/trpc/routers/time-slot.ts` |
| `clientPortal` | Donnees formatees pour le dashboard client        | `lib/trpc/routers/client.ts`    |
| `memberPortal` | Donnees formatees pour le dashboard coiffeur      | `lib/trpc/routers/member.ts`    |

Les routes metier sont exposees dans `lib/trpc/routers/index.ts`.

## Booking

### `booking.confirm`

Confirme une prise de rendez-vous depuis le flow public.

```ts
await trpc.booking.confirm.mutate({
  orgSlug: 'atelier-nova',
  serviceId: 'service-id',
  memberId: 'member-id',
  slotId: 'slot-id',
})
```

Regles :

- utilisateur connecte obligatoire ;
- le service doit appartenir au salon ;
- le service doit etre propose par le professionnel choisi ;
- le creneau doit appartenir au coiffeur choisi ;
- le creneau doit encore etre disponible au moment de la transaction ;
- le creneau est verrouille avec `isAvailable: false` ;
- le booking est cree en `CONFIRMED`.

Retour :

```ts
{
  bookingId: string
}
```

### `booking.confirmPublic`

Alias temporaire de `booking.confirm`.

Il existe uniquement pour ne pas casser l'UI actuelle. Les nouveaux appels doivent utiliser `booking.confirm`.

### `booking.cancel`

Annule une reservation.

```ts
await trpc.booking.cancel.mutate({
  bookingId: 'booking-id',
})
```

Regles :

- utilisateur connecte obligatoire ;
- autorise si l'utilisateur est le client du booking ;
- autorise si l'utilisateur est le coiffeur du booking ;
- autorise si l'utilisateur est le owner du salon ;
- refuse une reservation `COMPLETED` ;
- passe le booking en `CANCELLED` ;
- remet le creneau associe en `isAvailable: true`.

Retour :

```ts
{
  bookingId: string
  status: 'CANCELLED'
}
```

## Service

### `service.listByOrganization`

Liste les services d'un salon.

```ts
await trpc.service.listByOrganization.query({
  orgId: 'organization-id',
})
```

Acces :

- owner du salon ;
- membre du salon.

### `service.create`

Cree une prestation.

```ts
await trpc.service.create.mutate({
  orgId: 'organization-id',
  name: 'Coupe homme',
  description: 'Coupe et finitions',
  duration: 45,
  price: 35,
  memberIds: ['member-id'],
})
```

Acces :

- owner du salon uniquement.

Contraintes :

- `name` : 2 a 80 caracteres ;
- `description` : optionnelle, 500 caracteres max ;
- `duration` : 5 a 480 minutes ;
- `price` : 0 a 10 000.
- `memberIds` : optionnel, associe directement le service aux professionnels capables de le faire.

### `service.update`

Met a jour une prestation.

```ts
await trpc.service.update.mutate({
  serviceId: 'service-id',
  name: 'Coupe homme premium',
  price: 45,
})
```

Acces :

- owner du salon uniquement.

Au moins un champ modifiable doit etre fourni.

### `service.delete`

Supprime une prestation.

```ts
await trpc.service.delete.mutate({
  serviceId: 'service-id',
})
```

Acces :

- owner du salon uniquement.

Regle importante :

- suppression refusee si le service est deja lie a une reservation.

Retour :

```ts
{
  serviceId: string
}
```

### `service.setMemberServices`

Definit les services qu'un professionnel peut proposer.

```ts
await trpc.service.setMemberServices.mutate({
  memberId: 'member-id',
  serviceIds: ['service-cut', 'service-color'],
})
```

Acces :

- owner du salon ;
- professionnel concerne.

Regles :

- tous les services doivent appartenir au meme salon que le professionnel ;
- la liste remplace les associations existantes du professionnel ;
- une liste vide signifie que le professionnel ne propose aucun service.

Retour :

```ts
{
  memberId: string
  serviceIds: string[]
}
```

## TimeSlot

### `timeSlot.listByMember`

Liste les creneaux d'un coiffeur.

```ts
await trpc.timeSlot.listByMember.query({
  memberId: 'member-id',
})
```

Acces :

- coiffeur concerne ;
- owner du salon.

### `timeSlot.checkAvailability`

Verifie si un creneau est encore disponible.

```ts
await trpc.timeSlot.checkAvailability.query({
  timeSlotId: 'slot-id',
})
```

Retour :

```ts
{
  timeSlotId: string
  isAvailable: boolean
}
```

Cette route sert a l'UX. La vraie protection contre le double-booking reste dans `booking.confirm`.

### `timeSlot.create`

Cree un creneau.

```ts
await trpc.timeSlot.create.mutate({
  memberId: 'member-id',
  date: new Date('2026-06-01'),
  startTime: '09:00',
  endTime: '10:00',
  isAvailable: true,
})
```

Acces :

- coiffeur concerne ;
- owner du salon.

Contraintes :

- `startTime` et `endTime` au format `HH:mm` ;
- `endTime` doit etre apres `startTime` ;
- un meme coiffeur ne peut pas avoir deux creneaux avec la meme date et la meme heure de debut.

### `timeSlot.update`

Met a jour un creneau.

```ts
await trpc.timeSlot.update.mutate({
  timeSlotId: 'slot-id',
  startTime: '10:00',
  endTime: '11:00',
  isAvailable: false,
})
```

Acces :

- coiffeur concerne ;
- owner du salon.

Regles :

- refuse si le creneau est lie a une reservation ;
- au moins un champ modifiable doit etre fourni.

### `timeSlot.delete`

Supprime un creneau.

```ts
await trpc.timeSlot.delete.mutate({
  timeSlotId: 'slot-id',
})
```

Acces :

- coiffeur concerne ;
- owner du salon.

Regle importante :

- suppression refusee si le creneau est lie a une reservation.

Retour :

```ts
{
  timeSlotId: string
}
```

## Usage Cote React

Exemple mutation :

```tsx
const utils = trpc.useUtils()

const cancelBooking = trpc.booking.cancel.useMutation({
  onSuccess: () => {
    utils.clientPortal.upcomingBookings.invalidate()
    utils.clientPortal.bookingHistory.invalidate()
  },
})
```

Exemple appel :

```tsx
cancelBooking.mutate({ bookingId })
```

## Tests

Tests d'integration principaux :

- `lib/trpc/routers/booking.integration.test.ts`
- `lib/trpc/routers/service.integration.test.ts`
- `lib/trpc/routers/time-slot.integration.test.ts`

Commande cible :

```bash
pnpm exec vitest run --config vitest.integration.config.ts lib/trpc/routers/booking.integration.test.ts lib/trpc/routers/service.integration.test.ts lib/trpc/routers/time-slot.integration.test.ts
```
