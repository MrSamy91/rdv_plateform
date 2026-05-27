import { db } from '@/lib/db'
import { normalizePublicOrgSlug } from '@/lib/routes/organization-public-route'
import { listPublicSlotDates } from './public-slot-dates'
import { toPublicBookingSlot } from './public-booking-slot'

export { listPublicSlotDates }

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

  // 1. On récupère la durée du service si spécifiée, sinon on prend 30 mins par défaut
  let serviceDuration = 30
  if (filters.serviceId) {
    const service = await db.service.findUnique({
      where: { id: filters.serviceId },
      select: { duration: true },
    })
    if (service) serviceDuration = service.duration
  }

  // 2. On récupère les créneaux disponibles (les grands blocs)
  const availableSlots = await db.timeSlot.findMany({
    where: {
      isAvailable: true,
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
        organization: { slug },
      },
      date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, // Pas dans le passé
    },
    include: {
      member: {
        include: {
          organization: { select: { id: true, slug: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  // 3. On génère dynamiquement des sous-créneaux (ex: toutes les 15 mins)
  // si la durée du service tient dans l'espace restant du bloc.
  const virtualSlots: ((typeof availableSlots)[0] & { originalSlotId?: string })[] = []

  // Utilitaire interne très simple
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const toTime = (m: number) =>
    `${Math.floor(m / 60)
      .toString()
      .padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`

  const INTERVAL = 15 // Les clients peuvent réserver toutes les 15 minutes

  for (const slot of availableSlots) {
    let currentStart = toMins(slot.startTime)
    const blockEnd = toMins(slot.endTime)

    // Tant qu'on a la place de caler le service dans ce bloc
    while (currentStart + serviceDuration <= blockEnd) {
      virtualSlots.push({
        ...slot,
        id: slot.id, // On garde l'ID du grand bloc parent
        originalSlotId: slot.id, // On le garde de côté si besoin
        startTime: toTime(currentStart),
        endTime: toTime(currentStart + serviceDuration),
      })

      currentStart += INTERVAL
    }
  }

  return virtualSlots
}

// Forme prête pour l'UI publique (créneaux mappés + dates dérivées).
// Source unique partagée par le SSR (initialData) et la procédure tRPC booking.publicSlots.
export async function getPublicBookingSlots(
  orgSlug: string,
  filters: PublicOrganizationSlotFilters = {},
) {
  const slots = await listPublicOrganizationAvailableSlots(orgSlug, filters)

  return {
    slots: slots.map(toPublicBookingSlot),
    dates: listPublicSlotDates(slots),
  }
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
