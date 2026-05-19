'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { Role } from '@/generated/prisma/enums'

export async function updateUserRole(userId: string, role: Role) {
  await db.user.update({
    where: { id: userId },
    data: { role },
  })
  revalidatePath('/admin/users')
}
