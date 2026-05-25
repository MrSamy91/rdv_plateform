'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { Role } from '@/generated/prisma/enums'
import { requireAdmin } from '@/lib/auth'

const allowedRoles = Object.values(Role)

export async function updateUserRole(userId: string, role: Role) {
  await requireAdmin()

  if (!allowedRoles.includes(role)) {
    throw new Error('Role invalide')
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  })
  revalidatePath('/admin/users')
}
