import type { BookingStatus } from '@/generated/prisma/enums'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const statusLabels: Record<BookingStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}

const statusColors: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600',
  CONFIRMED: 'bg-[#489B6E]/10 text-[#489B6E]',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-destructive/10 text-destructive',
}

interface Booking {
  id: string
  service: string
  client: string
  date: string
  time: string
  status: BookingStatus
}

interface MemberNextBookingsProps {
  bookings: Booking[]
}

export function MemberNextBookings({ bookings }: MemberNextBookingsProps) {
  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Prochains rendez-vous</CardTitle>
          <CardDescription>
            {bookings.length === 0
              ? 'Vos prochaines réservations apparaîtront ici.'
              : `${bookings.length} RDV planifié${bookings.length > 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <p className="text-muted-foreground px-6 pb-6 text-sm">Aucun rendez-vous à venir.</p>
          ) : (
            <ol className="divide-y">
              {bookings.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{booking.service}</p>
                    <p className="text-muted-foreground text-sm">
                      {booking.client} · {booking.date} à {booking.time}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusColors[booking.status]}`}
                  >
                    {statusLabels[booking.status]}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
