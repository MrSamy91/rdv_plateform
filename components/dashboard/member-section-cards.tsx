'use client'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CalendarDays, Clock, Star, Users } from 'lucide-react'

interface MemberStats {
  todayBookingsCount: number
  weekBookingsCount: number
  monthClientsCount: number
  averageRating: number | null
  reviewsCount: number
}

export function MemberSectionCards({ stats }: { stats: MemberStats }) {
  const ratingLabel =
    stats.averageRating === null ? 'Aucun avis' : `${stats.averageRating.toFixed(1)} / 5`

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* RDV aujourd'hui */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>RDV aujourd&apos;hui</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.todayBookingsCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <CalendarDays size={12} className="mr-1" /> Jour
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Réservations du jour</div>
          <div className="text-muted-foreground">En attente ou confirmés</div>
        </CardFooter>
      </Card>

      {/* RDV cette semaine */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>RDV cette semaine</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.weekBookingsCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Clock size={12} className="mr-1" /> Semaine
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Total hebdomadaire</div>
          <div className="text-muted-foreground">Lundi → Dimanche</div>
        </CardFooter>
      </Card>

      {/* Clients ce mois */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Clients ce mois</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.monthClientsCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users size={12} className="mr-1" /> Mois
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Clients uniques</div>
          <div className="text-muted-foreground">Toutes réservations confondues</div>
        </CardFooter>
      </Card>

      {/* Note moyenne */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Note moyenne</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.averageRating === null ? '—' : stats.averageRating.toFixed(1)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Star size={12} className="mr-1" />
              {stats.reviewsCount} avis
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">{ratingLabel}</div>
          <div className="text-muted-foreground">Évaluations clients</div>
        </CardFooter>
      </Card>
    </div>
  )
}
