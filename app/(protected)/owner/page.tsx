import Link from 'next/link'
import { ArrowRight, CalendarCheck, Scissors, Users } from 'lucide-react'
import { requireOwner } from '@/lib/auth'
import { db } from '@/lib/db'
import { StatCard } from '@/components/dashboard/stat-card'

export default async function OwnerDashboardPage() {
  const { organization } = await requireOwner()

  // Aperçu du salon : 3 compteurs en parallèle (services, pros, réservations).
  const [servicesCount, membersCount, bookingsCount] = await Promise.all([
    db.service.count({ where: { orgId: organization.id } }),
    db.member.count({ where: { orgId: organization.id } }),
    db.booking.count({ where: { member: { orgId: organization.id } } }),
  ])

  return (
    <main className="flex flex-col gap-8 p-6 lg:p-8">
      <section>
        <h1 className="text-foreground text-2xl font-bold">{organization.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pilotez votre salon : catalogue de services et professionnels.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Services" value={servicesCount} icon={Scissors} />
        <StatCard title="Professionnels" value={membersCount} icon={Users} />
        <StatCard title="Réservations" value={bookingsCount} icon={CalendarCheck} />
      </section>

      <section>
        <Link
          href="/owner/services"
          className="bg-card hover:border-primary/40 group flex items-center justify-between rounded-xl border p-6 shadow-sm transition-colors"
        >
          <div>
            <p className="text-foreground font-semibold">Gérer les services</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Créez vos prestations et choisissez quels professionnels les proposent.
            </p>
          </div>
          <ArrowRight className="text-muted-foreground group-hover:text-primary size-5 shrink-0" />
        </Link>
      </section>
    </main>
  )
}
