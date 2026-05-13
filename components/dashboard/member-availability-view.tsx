'use client'

import { Clock } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { trpc } from '@/lib/trpc/client'

export function MemberAvailabilityView() {
  const availability = trpc.memberPortal.availability.useQuery()

  if (availability.isLoading) {
    return (
      <div className="bg-card text-muted-foreground rounded-xl border p-8 text-sm">
        Chargement des creneaux...
      </div>
    )
  }

  if (availability.isError || !availability.data) {
    return (
      <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border p-8 text-sm">
        Impossible de charger vos creneaux.
      </div>
    )
  }

  const data = availability.data

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Mes creneaux</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Disponibles"
          value={data.availableCount}
          description="Ouverts a la reservation"
          icon={Clock}
        />
        <StatCard
          title="Reserves"
          value={data.bookedCount}
          description="Deja pris par des clients"
          icon={Clock}
        />
      </div>

      <section className="bg-card rounded-xl border" aria-labelledby="member-slots-heading">
        <div className="border-b p-5">
          <h2 id="member-slots-heading" className="font-semibold">
            Planning des disponibilites
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Les creneaux non disponibles correspondent aux reservations deja prises.
          </p>
        </div>

        {data.slots.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center p-10 text-center">
            <Clock size={40} className="text-muted-foreground/30 mb-4" />
            <p className="font-semibold">Aucun creneau a venir</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Les prochains creneaux apparaitront ici.
            </p>
          </div>
        ) : (
          <ol className="divide-y">
            {data.slots.map((slot) => (
              <li key={slot.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold">{slot.date}</p>
                  <p className="text-muted-foreground text-sm">
                    {slot.startTime} - {slot.endTime}
                  </p>
                </div>
                <span
                  className={
                    slot.isAvailable
                      ? 'bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-semibold'
                      : 'bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs font-semibold'
                  }
                >
                  {slot.isAvailable ? 'Disponible' : 'Reserve'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
