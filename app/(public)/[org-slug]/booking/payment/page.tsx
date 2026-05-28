import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, Clock, CreditCard, Scissors, User } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { PaymentCheckout } from '@/components/booking/payment-checkout'
import { getSession } from '@/lib/auth'
import { getBookingForPayment } from '@/lib/payments/summary'

interface Props {
  params: Promise<{ 'org-slug': string }>
  searchParams: Promise<{ booking?: string }>
}

export const metadata: Metadata = {
  title: 'Paiement - CutBook',
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

export default async function PublicBookingPaymentPage({ params, searchParams }: Props) {
  const { 'org-slug': orgSlug } = await params
  const { booking: bookingId } = await searchParams

  // Le booking appartient a un user connecte -> on exige la session.
  const session = await getSession()
  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/${orgSlug}/booking/payment?booking=${bookingId ?? ''}`)}`,
    )
  }

  if (!bookingId) {
    notFound()
  }

  const booking = await getBookingForPayment(bookingId, session.user.id)
  if (!booking) {
    notFound()
  }

  // Deja paye en ligne -> rien a faire ici.
  if (booking.payment?.status === 'SUCCEEDED') {
    redirect('/client/bookings')
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      {/* Header pleine largeur au-dessus de la grille pour que recap (gauche) et
          iframe Stripe (droite) demarrent EXACTEMENT au meme niveau vertical. */}
      <div>
        <Link
          href="/client/bookings"
          className="mb-3 flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(37,49,34,0.5)' }}
        >
          <ChevronLeft size={14} />
          Mes reservations
        </Link>
        <h1 className="text-xl font-black" style={{ color: '#253122' }}>
          Paiement
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(37,49,34,0.5)' }}>
          Votre rendez-vous est confirme. Reglez en ligne ou payez sur place.
        </p>
      </div>

      {/* Recap colonne gauche, iframe colonne droite, alignes au top.
          Recap reste `sticky top-6` : il se verrouille des que le scroll fait
          remonter sa position au top-6, et ne bouge plus apres. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <section
          className="space-y-4 rounded-2xl border p-6 lg:sticky lg:top-6 lg:self-start"
          style={{ borderColor: 'rgba(37,49,34,0.1)', background: '#fff' }}
          aria-labelledby="payment-recap-heading"
        >
          <h2
            id="payment-recap-heading"
            className="text-lg font-black"
            style={{ color: '#253122' }}
          >
            {booking.member.organization.name}
          </h2>
          {[
            {
              icon: Scissors,
              label: 'Service',
              value: `${booking.service.name} - ${booking.service.duration} min`,
            },
            { icon: User, label: 'Professionnel', value: booking.member.user.name },
            {
              icon: CalendarDays,
              label: 'Date',
              value: dateFormatter.format(booking.timeSlot.date),
            },
            { icon: Clock, label: 'Heure', value: booking.timeSlot.startTime },
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
                A regler
              </span>
            </div>
            <span className="text-xl font-black" style={{ color: '#253122' }}>
              {booking.totalPrice} EUR
            </span>
          </div>
        </section>

        <div className="space-y-4">
          <PaymentCheckout bookingId={booking.id} />

          <Link
            href="/client/bookings"
            className="block text-center text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'rgba(37,49,34,0.5)' }}
          >
            Payer sur place
          </Link>
        </div>
      </div>
    </main>
  )
}
