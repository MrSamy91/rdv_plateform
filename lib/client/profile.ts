import { z } from 'zod'
import { db } from '@/lib/db'

export const updateClientPhoneSchema = z.object({
  phone: z.string().trim().max(32).nullable(),
})

export async function getClientProfile(clientId: string) {
  return await db.user.findUniqueOrThrow({
    where: { id: clientId },
    select: {
      name: true,
      email: true,
      phone: true,
      loyaltyPoints: true,
    },
  })
}

export async function updateClientPhone(
  clientId: string,
  input: z.infer<typeof updateClientPhoneSchema>,
) {
  const phone = input.phone?.trim() || null

  return await db.user.update({
    where: { id: clientId },
    data: { phone },
    select: {
      name: true,
      email: true,
      phone: true,
      loyaltyPoints: true,
    },
  })
}
