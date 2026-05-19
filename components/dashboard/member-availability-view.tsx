'use client'

import { Clock, CheckCircle2, CalendarX } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function MemberAvailabilityView() {
  const availability = trpc.memberPortal.availability.useQuery()

  if (availability.isLoading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (availability.isError || !availability.data) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="text-destructive pt-6 text-sm">
            Impossible de charger vos créneaux.
          </CardContent>
        </Card>
      </div>
    )
  }

  const { availableCount, bookedCount, slots } = availability.data
  const total = availableCount + bookedCount
  const fillRate = total > 0 ? Math.round((bookedCount / total) * 100) : 0

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Titre */}
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#253122' }}>
          Mes créneaux
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gérez vos disponibilités pour que les clients puissent réserver.
        </p>
      </div>

      {/* Stat cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3">
        <Card className="@container/card">
          <CardHeader className="pb-2">
            <CardDescription>Créneaux disponibles</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{availableCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <CheckCircle2 size={14} className="text-[#489B6E]" />
              Ouverts à la réservation
            </p>
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader className="pb-2">
            <CardDescription>Créneaux réservés</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{bookedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Clock size={14} className="text-amber-500" />
              Déjà pris par des clients
            </p>
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader className="pb-2">
            <CardDescription>Taux de remplissage</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{fillRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Barre de progression */}
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-[#489B6E] transition-all"
                style={{ width: `${fillRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des créneaux */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Planning des disponibilités</CardTitle>
            <CardDescription>
              Les créneaux non disponibles correspondent aux réservations déjà prises.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {slots.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center p-10 text-center">
                <div className="bg-muted mb-4 flex size-14 items-center justify-center rounded-2xl">
                  <CalendarX size={24} className="text-muted-foreground" />
                </div>
                <p className="font-semibold">Aucun créneau à venir</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Vos prochains créneaux apparaîtront ici.
                </p>
              </div>
            ) : (
              <ol className="divide-y">
                {slots.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                          slot.isAvailable ? 'bg-[#489B6E]/10' : 'bg-muted'
                        }`}
                      >
                        <Clock
                          size={15}
                          className={slot.isAvailable ? 'text-[#489B6E]' : 'text-muted-foreground'}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{slot.date}</p>
                        <p className="text-muted-foreground text-xs">
                          {slot.startTime} – {slot.endTime}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        slot.isAvailable
                          ? 'border-[#489B6E]/20 bg-[#489B6E]/10 text-xs text-[#489B6E]'
                          : 'bg-muted text-muted-foreground text-xs'
                      }
                    >
                      {slot.isAvailable ? 'Disponible' : 'Réservé'}
                    </Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
