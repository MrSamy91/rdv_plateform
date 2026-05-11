import { CalendarCheck, CreditCard, Star, Building2 } from 'lucide-react'

const features = [
  {
    icon: CalendarCheck,
    title: 'Réservation en temps réel',
    description:
      'Vos clients choisissent leur créneau 24h/24. Zéro double-booking grâce au verrou transactionnel.',
    tag: 'Booking',
  },
  {
    icon: CreditCard,
    title: 'Paiement Stripe intégré',
    description:
      'Payez en ligne, obtenez une confirmation instantanée. Les remboursements sont gérés en 2 clics.',
    tag: 'Stripe',
  },
  {
    icon: Star,
    title: 'Programme de fidélité',
    description:
      'Chaque réservation rapporte des points. Vos habitués reviennent plus souvent, naturellement.',
    tag: 'Fidélité',
  },
  {
    icon: Building2,
    title: 'Votre salon en ligne',
    description:
      'Une page dédiée à votre salon via /@votre-nom. Partagez-la, les clients réservent directement.',
    tag: 'Organisation',
  },
] as const

export function FeaturesSection() {
  return (
    <section className="px-6 py-24 lg:px-8" aria-labelledby="features-heading">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-16">
          <p
            className="mb-3 text-xs font-semibold tracking-widest uppercase"
            style={{ color: '#489B6E' }}
          >
            Fonctionnalités
          </p>
          <h2
            id="features-heading"
            className="text-3xl font-black tracking-tight sm:text-4xl"
            style={{ color: '#253122' }}
          >
            Tout ce dont vous avez besoin,
            <br />
            <span className="text-muted-foreground font-normal">rien de plus.</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group bg-card relative flex flex-col gap-5 rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: 'rgba(37,49,34,0.1)' }}
              >
                {/* Tag + icon */}
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: 'rgba(72,155,110,0.1)', color: '#489B6E' }}
                  >
                    {feature.tag}
                  </span>
                  <Icon size={18} style={{ color: '#C5A56E' }} />
                </div>

                <div>
                  <h3 className="text-foreground mb-2 leading-snug font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
