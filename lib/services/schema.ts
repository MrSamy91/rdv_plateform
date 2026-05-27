import { z } from 'zod'

// Schemas Zod du domaine "service", partages entre le router tRPC (validation
// serveur) et les formulaires owner. Extraits du router pour etre testables en
// isolation (unit tests) et eviter la duplication des contraintes.

// Champs metier d'un service (nom, description, duree, prix).
export const serviceFieldsSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).nullable().optional(),
  duration: z.number().int().min(5).max(480),
  price: z.number().min(0).max(10_000),
})

// Creation : champs metier + rattachement orga + assignation optionnelle de pros.
export const serviceInputSchema = serviceFieldsSchema.extend({
  orgId: z.string().min(1),
  memberIds: z.array(z.string().min(1)).optional(),
})

// Mise a jour : tous les champs optionnels, mais au moins un doit etre renseigne.
export const updateServiceSchema = serviceFieldsSchema
  .partial()
  .extend({
    serviceId: z.string().min(1),
  })
  .refine(
    ({ name, description, duration, price }) =>
      name !== undefined ||
      description !== undefined ||
      duration !== undefined ||
      price !== undefined,
    'Au moins un champ doit etre renseigne.',
  )

// Assignation par service : la liste (potentiellement vide) des pros qui le proposent.
export const setServiceMembersSchema = z.object({
  serviceId: z.string().min(1),
  memberIds: z.array(z.string().min(1)),
})
