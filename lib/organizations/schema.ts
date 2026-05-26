import { z } from 'zod'

export const organizationSlugSchema = z
  .string()
  .trim()
  .min(2, 'Minimum 2 caracteres.')
  .max(30, 'Maximum 30 caracteres.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Minuscules, chiffres et tirets uniquement.')

const phoneSchema = z
  .string()
  .trim()
  .min(8, 'Numero trop court.')
  .max(20, 'Numero trop long.')
  .regex(/^\+?[0-9\s().-]+$/, 'Numero invalide.')
  .refine((value) => {
    const digitCount = value.replace(/\D/g, '').length
    return digitCount >= 8 && digitCount <= 15
  }, 'Numero invalide.')

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Minimum 2 caracteres.')
    .max(50, 'Maximum 50 caracteres.')
    .regex(/[\p{L}\p{N}]/u, 'Nom invalide.'),
  slug: organizationSlugSchema,
  address: z
    .string()
    .trim()
    .min(8, 'Adresse trop courte.')
    .max(120, 'Adresse trop longue.')
    .regex(/[\p{L}\p{N}]/u, 'Adresse invalide.'),
  phone: phoneSchema,
  description: z
    .string()
    .trim()
    .max(300, 'Maximum 300 caracteres.')
    .transform((value) => value || undefined)
    .optional(),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
