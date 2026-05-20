import { z } from 'zod'
import { db } from '@/lib/db'

// ── Schemas ───────────────────────────────────────────────────────────────────

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères').max(60, 'Maximum 60 caractères'),
  description: z.string().max(200, 'Maximum 200 caractères').optional(),
  duration: z
    .number({ invalid_type_error: 'Durée requise' })
    .int()
    .min(5, 'Minimum 5 minutes')
    .max(480, 'Maximum 8 heures'),
  price: z
    .number({ invalid_type_error: 'Prix requis' })
    .min(0, 'Le prix doit être positif')
    .max(9999, 'Prix trop élevé'),
})

export const deleteServiceSchema = z.object({
  serviceId: z.string().cuid(),
})

export type CreateServiceInput = z.infer<typeof createServiceSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getMemberOrg(userId: string) {
  const member = await db.member.findUnique({
    where: { userId },
    select: { id: true, orgId: true },
  })
  return member
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getMemberServices(userId: string) {
  const member = await getMemberOrg(userId)
  if (!member) return null

  return db.service.findMany({
    where: { orgId: member.orgId },
    orderBy: { createdAt: 'asc' },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createMemberService(userId: string, input: CreateServiceInput) {
  const member = await getMemberOrg(userId)
  if (!member) return null

  return db.service.create({
    data: {
      orgId: member.orgId,
      name: input.name,
      description: input.description,
      duration: input.duration,
      price: input.price,
    },
  })
}

export async function deleteMemberService(userId: string, serviceId: string) {
  const member = await getMemberOrg(userId)
  if (!member) return null

  // Vérifier que le service appartient bien à l'orga du membre
  const service = await db.service.findFirst({
    where: { id: serviceId, orgId: member.orgId },
  })
  if (!service) return null

  return db.service.delete({ where: { id: serviceId } })
}
