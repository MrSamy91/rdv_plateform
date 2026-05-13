import { z } from 'zod'
import { db } from '@/lib/db'

export const updateMemberProfileSchema = z.object({
  bio: z.string().max(500).nullable(),
  specialties: z.string().max(160).nullable(),
  experience: z.coerce.number().int().min(0).max(80),
})

export async function getMemberProfile(userId: string) {
  const member = await db.member.findUnique({
    where: { userId },
    select: {
      id: true,
      bio: true,
      specialties: true,
      experience: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      organization: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  })

  if (!member) {
    return null
  }

  return {
    id: member.id,
    name: member.user.name,
    email: member.user.email,
    phone: member.user.phone,
    organizationName: member.organization.name,
    organizationSlug: member.organization.slug,
    bio: member.bio,
    specialties: member.specialties,
    experience: member.experience,
  }
}

export async function updateMemberProfile(
  userId: string,
  input: z.infer<typeof updateMemberProfileSchema>,
) {
  const member = await db.member.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!member) {
    return null
  }

  const updatedMember = await db.member.update({
    where: { id: member.id },
    data: {
      bio: input.bio?.trim() || null,
      specialties: input.specialties?.trim() || null,
      experience: input.experience,
    },
  })

  return {
    id: updatedMember.id,
    bio: updatedMember.bio,
    specialties: updatedMember.specialties,
    experience: updatedMember.experience,
  }
}
