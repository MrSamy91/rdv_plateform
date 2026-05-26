import 'dotenv/config'

import { fileURLToPath } from 'node:url'
import { BookingStatus, PrismaClient, RewardStatus, Role } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from 'better-auth/crypto'

export const defaultSeedPassword = 'CutBookDemo123!'

export const seedUsers = {
  // role = identite plateforme (CLIENT). Les casquettes orga sont des relations :
  //   owner -> Organization.ownerId (cf. runSeed) ; member -> ligne Member (seedMembers).
  owner: {
    id: 'seed-user-owner',
    email: 'owner@cutbook.test',
    name: 'Nora Benali',
    phone: '+33102030405',
    role: Role.CLIENT,
    loyaltyPoints: 0,
  },
  memberOne: {
    id: 'seed-user-member-1',
    email: 'mila@cutbook.test',
    name: 'Mila Laurent',
    phone: '+33102030406',
    role: Role.CLIENT,
    loyaltyPoints: 0,
  },
  memberTwo: {
    id: 'seed-user-member-2',
    email: 'leo@cutbook.test',
    name: 'Leo Martin',
    phone: '+33102030407',
    role: Role.CLIENT,
    loyaltyPoints: 0,
  },
  clientOne: {
    id: 'seed-user-client-1',
    email: 'client@cutbook.test',
    name: 'Camille Durand',
    phone: '+33601020304',
    role: Role.CLIENT,
    loyaltyPoints: 120,
  },
  clientTwo: {
    id: 'seed-user-client-2',
    email: 'ines@cutbook.test',
    name: 'Ines Robert',
    phone: '+33601020305',
    role: Role.CLIENT,
    loyaltyPoints: 40,
  },
} as const

export const seedOrganization = {
  id: 'seed-org-atelier-nova',
  name: 'Atelier Nova',
  slug: 'atelier-nova',
  address: '18 rue des Martyrs, 75009 Paris',
  phone: '+33142880011',
  description:
    'Salon pilote CutBook pour tester la reservation, le planning equipe et les avis clients.',
  imageUrl:
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
}

export const seedMembers = {
  mila: {
    id: 'seed-member-mila',
    userId: seedUsers.memberOne.id,
    specialties: 'Coupe femme, balayage, diagnostic couleur',
    bio: 'Specialiste couleur avec une approche precise et naturelle.',
    experience: 7,
  },
  leo: {
    id: 'seed-member-leo',
    userId: seedUsers.memberTwo.id,
    specialties: 'Coupe homme, barbe, entretien express',
    bio: 'Expert coupe courte et finitions propres.',
    experience: 5,
  },
} as const

export const seedServices = {
  cut: {
    id: 'seed-service-cut',
    name: 'Coupe & brushing',
    description: 'Diagnostic rapide, coupe et brushing.',
    duration: 60,
    price: 55,
  },
  color: {
    id: 'seed-service-color',
    name: 'Balayage signature',
    description: 'Balayage naturel avec patine et soin.',
    duration: 120,
    price: 145,
  },
  beard: {
    id: 'seed-service-beard',
    name: 'Coupe homme & barbe',
    description: 'Coupe, taille de barbe et finitions.',
    duration: 45,
    price: 42,
  },
} as const

export function dayFromNow(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(0, 0, 0, 0)
  return date
}

export function buildSeedTimeSlots() {
  return [
    {
      id: 'seed-slot-mila-1',
      memberId: seedMembers.mila.id,
      date: dayFromNow(1),
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: false,
    },
    {
      id: 'seed-slot-mila-2',
      memberId: seedMembers.mila.id,
      date: dayFromNow(1),
      startTime: '10:30',
      endTime: '11:30',
    },
    {
      id: 'seed-slot-mila-3',
      memberId: seedMembers.mila.id,
      date: dayFromNow(2),
      startTime: '14:00',
      endTime: '16:00',
    },
    {
      id: 'seed-slot-leo-1',
      memberId: seedMembers.leo.id,
      date: dayFromNow(1),
      startTime: '11:00',
      endTime: '11:45',
      isAvailable: false,
    },
    {
      id: 'seed-slot-leo-2',
      memberId: seedMembers.leo.id,
      date: dayFromNow(2),
      startTime: '09:30',
      endTime: '10:15',
    },
    {
      id: 'seed-slot-leo-3',
      memberId: seedMembers.leo.id,
      date: dayFromNow(3),
      startTime: '15:00',
      endTime: '15:45',
    },
  ]
}

export function buildSeedBookings() {
  return [
    {
      id: 'seed-booking-confirmed',
      clientId: seedUsers.clientOne.id,
      memberId: seedMembers.mila.id,
      serviceId: seedServices.cut.id,
      timeSlotId: 'seed-slot-mila-1',
      status: BookingStatus.CONFIRMED,
      totalPrice: seedServices.cut.price,
      notes: 'Premiere visite, souhaite garder de la longueur.',
    },
    {
      id: 'seed-booking-completed',
      clientId: seedUsers.clientTwo.id,
      memberId: seedMembers.leo.id,
      serviceId: seedServices.beard.id,
      timeSlotId: 'seed-slot-leo-1',
      status: BookingStatus.COMPLETED,
      totalPrice: seedServices.beard.price,
      completedAt: dayFromNow(-2),
    },
  ]
}

export function buildSeedMemberServices() {
  return [
    {
      memberId: seedMembers.mila.id,
      serviceId: seedServices.cut.id,
    },
    {
      memberId: seedMembers.mila.id,
      serviceId: seedServices.color.id,
    },
    {
      memberId: seedMembers.leo.id,
      serviceId: seedServices.beard.id,
    },
  ]
}

export function buildSeedReviews() {
  return [
    {
      id: 'seed-review-mila',
      clientId: seedUsers.clientOne.id,
      memberId: seedMembers.mila.id,
      rating: 5,
      comment: 'Diagnostic clair et resultat tres naturel.',
    },
    {
      id: 'seed-review-leo',
      clientId: seedUsers.clientTwo.id,
      memberId: seedMembers.leo.id,
      rating: 4,
      comment: 'Rapide, propre, exactement ce que je voulais.',
    },
  ]
}

export function buildSeedRewards() {
  return [
    {
      id: 'seed-reward-available',
      clientId: seedUsers.clientOne.id,
      type: 'discount_20',
      status: RewardStatus.AVAILABLE,
      expirationDate: dayFromNow(45),
    },
    {
      id: 'seed-reward-used',
      clientId: seedUsers.clientTwo.id,
      type: 'free_care',
      status: RewardStatus.USED,
      expirationDate: dayFromNow(15),
      usedAt: dayFromNow(-3),
    },
  ]
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed the database')
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

async function clearSeedData(prisma: PrismaClient) {
  const userIds = Object.values(seedUsers).map((user) => user.id)
  const memberIds = Object.values(seedMembers).map((member) => member.id)
  const serviceIds = Object.values(seedServices).map((service) => service.id)

  await prisma.booking.deleteMany({
    where: {
      OR: [
        { clientId: { in: userIds } },
        { memberId: { in: memberIds } },
        { serviceId: { in: serviceIds } },
      ],
    },
  })
  await prisma.review.deleteMany({
    where: {
      OR: [{ clientId: { in: userIds } }, { memberId: { in: memberIds } }],
    },
  })
  await prisma.reward.deleteMany({ where: { clientId: { in: userIds } } })
  await prisma.memberService.deleteMany({
    where: {
      OR: [{ memberId: { in: memberIds } }, { serviceId: { in: serviceIds } }],
    },
  })
  await prisma.timeSlot.deleteMany({ where: { memberId: { in: memberIds } } })
  await prisma.service.deleteMany({ where: { id: { in: serviceIds } } })
  await prisma.member.deleteMany({ where: { id: { in: memberIds } } })
  await prisma.organization.deleteMany({ where: { id: seedOrganization.id } })
  await prisma.account.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}

async function createDemoUser(
  prisma: PrismaClient,
  user: (typeof seedUsers)[keyof typeof seedUsers],
  passwordHash: string,
) {
  await prisma.user.create({
    data: {
      ...user,
      emailVerified: true,
    },
  })

  await prisma.account.create({
    data: {
      id: `seed-account-${user.id}`,
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: passwordHash,
    },
  })
}

export async function runSeed() {
  const prisma = createPrismaClient()

  try {
    console.log('Seeding...')

    await clearSeedData(prisma)

    const seedPassword = process.env.SEED_USER_PASSWORD ?? defaultSeedPassword
    const passwordHash = await hashPassword(seedPassword)

    for (const user of Object.values(seedUsers)) {
      await createDemoUser(prisma, user, passwordHash)
    }

    await prisma.organization.create({
      data: {
        ...seedOrganization,
        ownerId: seedUsers.owner.id,
      },
    })

    await prisma.member.createMany({
      data: [
        {
          ...seedMembers.mila,
          orgId: seedOrganization.id,
        },
        {
          ...seedMembers.leo,
          orgId: seedOrganization.id,
        },
      ],
    })

    await prisma.service.createMany({
      data: Object.values(seedServices).map((service) => ({
        ...service,
        orgId: seedOrganization.id,
      })),
    })

    await prisma.timeSlot.createMany({ data: buildSeedTimeSlots() })
    await prisma.memberService.createMany({ data: buildSeedMemberServices() })
    await prisma.booking.createMany({ data: buildSeedBookings() })
    await prisma.review.createMany({ data: buildSeedReviews() })
    await prisma.reward.createMany({ data: buildSeedRewards() })

    console.log('Seed termine')
    console.log(
      'Comptes demo : owner@cutbook.test, mila@cutbook.test, leo@cutbook.test, client@cutbook.test',
    )
    console.log(`Mot de passe demo : variable SEED_USER_PASSWORD ou ${defaultSeedPassword}`)
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed().catch((e: unknown) => {
    console.error('Seed echec :', e)
    process.exit(1)
  })
}
