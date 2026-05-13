import { CalendarDays, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/stat-card'
import { Button } from '@/components/ui/button'

export function MemberDashboardOverview() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
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
            value="0"
            description="Aucun RDV ce jour"
            icon={CalendarDays}
          />
          <StatCard
            title="RDV cette semaine"
            value="0"
            description="Total de la semaine"
            icon={Clock}
          />
          <StatCard title="Clients ce mois" value="0" description="Clients uniques" icon={Users} />
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
