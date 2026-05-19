import { db } from '@/lib/db'

export async function getAdminUsers() {
  return db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      image: true,
      _count: {
        select: { bookings: true },
      },
    },
  })
}

export type AdminUser = Awaited<ReturnType<typeof getAdminUsers>>[number]
