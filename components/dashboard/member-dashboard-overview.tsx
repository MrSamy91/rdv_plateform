'use client'

import { CalendarDays, Clock, Star, Users } from 'lucide-react'
import Link from 'next/link'
import type { BookingStatus } from '@/generated/prisma/enums'
import { StatCard } from '@/components/dashboard/stat-card'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'

const statusLabels: Record<BookingStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirme',
  COMPLETED: 'Termine',
  CANCELLED: 'Annule',
}

export function MemberDashboardOverview() {
  const summary = trpc.memberPortal.dashboardSummary.useQuery()

  if (summary.isLoading) {
    return (
      <div className="bg-card text-muted-foreground rounded-xl border p-8 text-sm">
        Chargement du tableau de bord...
      </div>
    )
  }

  if (summary.isError || !summary.data) {
    return (
      <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border p-8 text-sm">
        Impossible de charger votre espace professionnel.
      </div>
    )
  }

  const data = summary.data
  const rating = data.averageRating === null ? 'Aucun avis' : `${data.averageRating.toFixed(1)}/5`

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="bg-card rounded-xl border p-6" aria-labelledby="member-profile-heading">
        <p className="text-muted-foreground text-sm">Espace professionnel</p>
        <h1 id="member-profile-heading" className="mt-1 text-2xl font-bold">
          Bonjour {data.profile.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {data.profile.organizationName}
          {data.profile.specialties ? ` - ${data.profile.specialties}` : ''}
        </p>
      </section>

      <section aria-labelledby="member-stats-heading">
        <h2
          id="member-stats-heading"
          className="text-muted-foreground mb-4 text-sm font-medium tracking-wider uppercase"
        >
          Aujourd&apos;hui
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="RDV aujourd'hui"
            value={data.todayBookingsCount}
            description="Reservations du jour"
            icon={CalendarDays}
          />
          <StatCard
            title="RDV cette semaine"
            value={data.weekBookingsCount}
            description="Total de la semaine"
            icon={Clock}
          />
          <StatCard
            title="Clients ce mois"
            value={data.monthClientsCount}
            description="Clients uniques"
            icon={Users}
          />
        </div>
      </section>

      <section aria-labelledby="member-next-bookings-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2
            id="member-next-bookings-heading"
            className="text-muted-foreground text-sm font-medium tracking-wider uppercase"
          >
            Prochains RDV
          </h2>
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <Star size={14} className="text-primary" />
            {rating} ({data.reviewsCount})
          </div>
        </div>
        <div className="bg-card overflow-hidden rounded-xl border">
          {data.nextBookings.length === 0 ? (
            <p className="text-muted-foreground p-6 text-sm">Aucun rendez-vous a venir.</p>
          ) : (
            <ol className="divide-y">
              {data.nextBookings.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{booking.service}</p>
                    <p className="text-muted-foreground text-sm">
                      {booking.client} - {booking.date} a {booking.time}
                    </p>
                  </div>
                  <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-semibold">
                    {statusLabels[booking.status]}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section aria-labelledby="member-actions-heading">
        <h2
          id="member-actions-heading"
          className="text-muted-foreground mb-4 text-sm font-medium tracking-wider uppercase"
        >
          Actions rapides
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-card space-y-3 rounded-xl border p-6">
            <h3 className="font-semibold">Mon calendrier</h3>
            <p className="text-muted-foreground text-sm">
              Visualisez tous vos RDV en vue semaine ou mois.
            </p>
            <Button id="member-view-calendar" size="sm" asChild>
              <Link href="/member/calendar">Ouvrir le calendrier</Link>
            </Button>
          </div>
          <div className="bg-card space-y-3 rounded-xl border p-6">
            <h3 className="font-semibold">Mes disponibilites</h3>
            <p className="text-muted-foreground text-sm">
              Gerez vos creneaux pour que les clients puissent reserver.
            </p>
            <Button id="member-manage-slots" size="sm" variant="outline" asChild>
              <Link href="/member/availability">Gerer les creneaux</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
