'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'
import { getPublicOrgBookingSlotHref } from '@/lib/routes/organization-public-route'

interface PublicBookingSelectorProps {
  orgSlug: string
  services: Array<{
    id: string
    name: string
    description: string | null
    duration: number
    price: number
  }>
  members: Array<{
    id: string
    specialties: string | null
    services?: Array<{
      serviceId: string
    }>
    user: {
      name: string
    }
  }>
}

export function PublicBookingSelector({ orgSlug, services, members }: PublicBookingSelectorProps) {
  const [serviceId, setServiceId] = useState('')
  const [memberId, setMemberId] = useState('')
  const canContinue = serviceId.length > 0 && memberId.length > 0
  const availableMembers = useMemo(() => {
    if (!serviceId) {
      return members
    }

    return members.filter((member) =>
      (member.services ?? []).some((service) => service.serviceId === serviceId),
    )
  }, [members, serviceId])

  function handleServiceChange(nextServiceId: string) {
    setServiceId(nextServiceId)

    if (!memberId) {
      return
    }

    const selectedMember = members.find((member) => member.id === memberId)
    const selectedMemberCanDoService = selectedMember?.services?.some(
      (service) => service.serviceId === nextServiceId,
    )

    if (!selectedMemberCanDoService) {
      setMemberId('')
    }
  }

  const slotHref = useMemo(() => {
    if (!canContinue) {
      return undefined
    }

    const search = new URLSearchParams({ service: serviceId, member: memberId })
    return getPublicOrgBookingSlotHref(orgSlug, search.toString())
  }, [canContinue, memberId, orgSlug, serviceId])

  const enabledNextClassName =
    'inline-flex w-fit items-center gap-2 rounded-lg border-2 border-transparent bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-green-600 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none'
  const disabledNextClassName =
    'inline-flex w-fit cursor-not-allowed items-center gap-2 rounded-lg border-2 border-transparent bg-slate-200 px-6 py-3 text-sm font-bold text-slate-400 opacity-60'

  return (
    <>
      <section aria-labelledby="service-heading">
        <h2 id="service-heading" className="mb-4 text-sm font-semibold text-slate-800">
          Choisissez un service
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <label
              key={service.id}
              className="border-border bg-card flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-slate-50"
            >
              <input
                type="radio"
                name="service"
                value={service.id}
                checked={serviceId === service.id}
                onChange={() => handleServiceChange(service.id)}
                className="mt-0.5 accent-green-500"
              />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800">{service.name}</span>
                {service.description && (
                  <span className="mt-0.5 block text-xs text-slate-500">{service.description}</span>
                )}
                <span className="mt-1 block text-xs font-medium text-green-500">
                  {service.duration} min - {service.price} EUR
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="member-heading">
        <h2 id="member-heading" className="mb-4 text-sm font-semibold text-slate-800">
          Choisissez un professionnel
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {availableMembers.map((member) => (
            <label
              key={member.id}
              className="border-border bg-card flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-slate-50"
            >
              <input
                type="radio"
                name="member"
                value={member.id}
                checked={memberId === member.id}
                onChange={() => setMemberId(member.id)}
                className="accent-green-500"
              />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <User size={16} className="text-slate-400" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  {member.user.name}
                </span>
                {member.specialties && (
                  <span className="block text-xs text-slate-500">{member.specialties}</span>
                )}
              </span>
            </label>
          ))}
          {serviceId && availableMembers.length === 0 && (
            <p className="text-sm text-slate-500">
              Aucun professionnel ne propose encore ce service.
            </p>
          )}
        </div>
      </section>

      {canContinue && slotHref ? (
        <Link
          id="booking-step1-next"
          href={slotHref}
          aria-disabled="false"
          className={enabledNextClassName}
        >
          Choisir un creneau
        </Link>
      ) : (
        <span
          id="booking-step1-next"
          role="link"
          aria-disabled="true"
          className={disabledNextClassName}
        >
          Choisir un creneau
        </span>
      )}
    </>
  )
}
