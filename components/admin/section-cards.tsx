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
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  usersThisMonth: number
  usersTrend: number
  totalOrgs: number
  bookingsThisMonth: number
  bookingsTrend: number
  revenueThisMonth: number
  revenueTrend: number
}

function TrendBadge({ trend }: { trend: number }) {
  const up = trend >= 0
  return (
    <Badge variant="outline">
      {up ? <TrendingUpIcon /> : <TrendingDownIcon />}
      {up ? '+' : ''}
      {trend}%
    </Badge>
  )
}

function TrendLine({ trend }: { trend: number }) {
  const up = trend >= 0
  return (
    <div className="line-clamp-1 flex gap-2 font-medium">
      {up ? `En hausse de ${trend}%` : `En baisse de ${Math.abs(trend)}%`}
      {up ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
    </div>
  )
}

export function SectionCards({ stats }: { stats: AdminStats }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Réservations ce mois</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.bookingsThisMonth.toLocaleString('fr-FR')}
          </CardTitle>
          <CardAction>
            <TrendBadge trend={stats.bookingsTrend} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendLine trend={stats.bookingsTrend} />
          <div className="text-muted-foreground">Par rapport au mois dernier</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Nouveaux utilisateurs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.usersThisMonth.toLocaleString('fr-FR')}
          </CardTitle>
          <CardAction>
            <TrendBadge trend={stats.usersTrend} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendLine trend={stats.usersTrend} />
          <div className="text-muted-foreground">
            {stats.totalUsers.toLocaleString('fr-FR')} au total
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Organisations actives</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalOrgs.toLocaleString('fr-FR')}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Total</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Espaces professionnels</div>
          <div className="text-muted-foreground">Organisations créées sur CutBook</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Revenus ce mois</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.revenueThisMonth.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            })}
          </CardTitle>
          <CardAction>
            <TrendBadge trend={stats.revenueTrend} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendLine trend={stats.revenueTrend} />
          <div className="text-muted-foreground">Réservations complétées</div>
        </CardFooter>
      </Card>
    </div>
  )
}
