import { db } from '@/lib/db'
import { normalizePublicOrgSlug } from '@/lib/routes/organization-public-route'
export { listPublicSlotDates } from './public-slot-dates'

export async function listPublicOrganizations() {
  return await db.organization.findMany({
    include: {
      services: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
        orderBy: { price: 'asc' },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getPublicOrganizationBySlug(orgSlug: string) {
  const slug = normalizePublicOrgSlug(orgSlug)

  return await db.organization.findUnique({
    where: { slug },
    include: {
      services: { orderBy: { price: 'asc' } },
      members: {
        include: {
          services: {
            select: {
              serviceId: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  })
}

interface PublicOrganizationSlotFilters {
  memberId?: string
  serviceId?: string
}

export async function listPublicOrganizationAvailableSlots(
  orgSlug: string,
  filters: PublicOrganizationSlotFilters = {},
) {
  const slug = normalizePublicOrgSlug(orgSlug)

  return await db.timeSlot.findMany({
    where: {
      member: {
        ...(filters.memberId ? { id: filters.memberId } : {}),
        ...(filters.serviceId
          ? {
              services: {
                some: {
                  serviceId: filters.serviceId,
                },
              },
            }
          : {}),
        organization: {
          slug,
        },
      },
    },
    include: {
      member: {
        include: {
          organization: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
}

interface PublicBookingConfirmationInput {
  serviceId?: string
  memberId?: string
  slotId?: string
  time?: string
}

export async function getPublicBookingConfirmationSummary(
  orgSlug: string,
  input: PublicBookingConfirmationInput,
) {
  if (!input.serviceId || !input.memberId || !input.slotId) {
    return null
  }

  const slug = normalizePublicOrgSlug(orgSlug)

  const organization = await db.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      services: {
        where: {
          id: input.serviceId,
          members: {
            some: {
              memberId: input.memberId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      },
      members: {
        where: {
          id: input.memberId,
          services: {
            some: {
              serviceId: input.serviceId,
            },
          },
        },
        select: {
          id: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!organization) {
    return null
  }

  const slot = await db.timeSlot.findFirst({
    where: {
      id: input.slotId,
      member: {
        id: input.memberId,
        organization: {
          slug,
        },
      },
    },
    include: {
      member: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  const service = organization.services[0]
  const member = organization.members[0]

  if (!service || !member || !slot) {
    return null
  }

  return {
    org: organization.name,
    orgSlug: organization.slug,
    service: service.name,
    member: member.user.name,
    date: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(slot.date),
    time: slot.startTime,
    duration: service.duration,
    price: service.price,
  }
}
