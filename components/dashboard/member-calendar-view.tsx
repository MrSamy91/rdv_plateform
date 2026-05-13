'use client'

import { CalendarDays, Clock } from 'lucide-react'
import type { BookingStatus } from '@/generated/prisma/enums'
import { trpc } from '@/lib/trpc/client'

const statusLabels: Record<BookingStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirme',
  COMPLETED: 'Termine',
  CANCELLED: 'Annule',
}

export function MemberCalendarView() {
  const bookings = trpc.memberPortal.calendarBookings.useQuery()

  if (bookings.isLoading) {
    return (
      <div className="bg-card text-muted-foreground rounded-xl border p-8 text-sm">
        Chargement du calendrier...
      </div>
    )
  }

  if (bookings.isError || !bookings.data) {
    return (
      <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border p-8 text-sm">
        Impossible de charger vos rendez-vous.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Mon calendrier</h1>
      <section className="bg-card rounded-xl border" aria-labelledby="member-calendar-heading">
        <div className="border-b p-5">
          <h2 id="member-calendar-heading" className="font-semibold">
            Rendez-vous a venir
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Liste synchronisee avec les reservations confirmees ou en attente.
          </p>
        </div>

        {bookings.data.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center p-10 text-center">
            <CalendarDays size={40} className="text-muted-foreground/30 mb-4" />
            <p className="font-semibold">Aucun rendez-vous planifie</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Les nouvelles reservations apparaitront ici automatiquement.
            </p>
          </div>
        ) : (
          <ol className="divide-y">
            {bookings.data.map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-start gap-4 p-5">
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Clock size={17} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{booking.service}</p>
                    <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-semibold">
                      {statusLabels[booking.status]}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {booking.client} - {booking.date} a {booking.time}
                  </p>
                  {booking.notes && (
                    <p className="text-muted-foreground mt-2 text-sm">Note : {booking.notes}</p>
                  )}
                </div>
                <p className="text-sm font-semibold">{booking.price} EUR</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
