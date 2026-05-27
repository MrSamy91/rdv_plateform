import { z } from 'zod'

// Recrutement : seul l'email est saisi par le owner (l'orga vient du contexte serveur).
export const recruitEmailSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
})

export const invitationTokenSchema = z.object({
  token: z.string().min(1),
})

export const invitationIdSchema = z.object({
  invitationId: z.string().min(1),
})
