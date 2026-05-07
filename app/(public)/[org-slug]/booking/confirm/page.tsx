import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, Clock, CreditCard, Scissors, User } from 'lucide-react'
import { notFound } from 'next/navigation'
import { ConfirmBookingForm } from '@/components/booking/confirm-booking-form'
import { getPublicBookingConfirmationSummary } from '@/lib/organizations/public-organization'
import { getPublicOrgBookingSlotHref } from '@/lib/routes/organization-public-route'
import { confirmBookingAction } from './actions'

interface Props {
  params: Promise<{ 'org-slug': string }>
  searchParams: Promise<{ service?: string; member?: string; slot?: string; time?: string }>
}

export const metadata: Metadata = {
  title: 'Confirmer votre reservation - CutBook',
}

export default async function PublicBookingConfirmPage({ params, searchParams }: Props) {
  const { 'org-slug': orgSlug } = await params
  const { service, member, slot, time } = await searchParams

  const summary = await getPublicBookingConfirmationSummary(orgSlug, {
    serviceId: service,
    memberId: member,
    slotId: slot,
    time,
  })

  if (!summary) {
    notFound()
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <div>
        <Link
          href={getPublicOrgBookingSlotHref(orgSlug, { service, member })}
          className="mb-3 flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(37,49,34,0.5)' }}
        >
          <ChevronLeft size={14} />
          Changer de creneau
        </Link>
        <h1 className="text-xl font-black" style={{ color: '#253122' }}>
          Recapitulatif
        </h1>
      </div>

      <section
        className="space-y-4 rounded-2xl border p-6"
        style={{ borderColor: 'rgba(37,49,34,0.1)', background: '#fff' }}
        aria-labelledby="recap-heading"
      >
        <h2 id="recap-heading" className="text-lg font-black" style={{ color: '#253122' }}>
          {summary.org}
        </h2>
        {[
          {
            icon: Scissors,
            label: 'Service',
            value: `${summary.service} - ${summary.duration} min`,
          },
          { icon: User, label: 'Professionnel', value: summary.member },
          { icon: CalendarDays, label: 'Date', value: summary.date },
          { icon: Clock, label: 'Heure', value: summary.time },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon size={15} style={{ color: 'rgba(37,49,34,0.4)' }} />
            <div className="flex flex-1 items-center justify-between gap-4">
              <span className="text-sm" style={{ color: 'rgba(37,49,34,0.5)' }}>
                {label}
              </span>
              <span className="text-right text-sm font-medium" style={{ color: '#253122' }}>
                {value}
              </span>
            </div>
          </div>
        ))}
        <div
          className="flex items-center justify-between border-t pt-4"
          style={{ borderColor: 'rgba(37,49,34,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <CreditCard size={15} style={{ color: '#C5A56E' }} />
            <span className="text-sm font-semibold" style={{ color: '#253122' }}>
              Total
            </span>
          </div>
          <span className="text-xl font-black" style={{ color: '#253122' }}>
            {summary.price} EUR
          </span>
        </div>
      </section>

      <ConfirmBookingForm
        orgSlug={orgSlug}
        serviceId={service}
        memberId={member}
        slotId={slot}
        action={confirmBookingAction}
      />
    </main>
  )
}
