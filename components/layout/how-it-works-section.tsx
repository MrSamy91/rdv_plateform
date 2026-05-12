const steps = [
  {
    number: '01',
    title: 'Créez votre page salon',
    description:
      'En 5 minutes, votre salon a une URL dédiée /@votre-salon avec vos services, vos membres et vos horaires.',
    detail: 'Gratuit, sans carte bancaire',
  },
  {
    number: '02',
    title: 'Vos clients choisissent',
    description:
      'Ils voient vos disponibilités en temps réel et réservent le créneau qui leur convient, depuis leur téléphone.',
    detail: 'Disponible 24h/24, 7j/7',
  },
  {
    number: '03',
    title: "Vous n'avez qu'à coiffer",
    description:
      'Confirmation automatique par email, rappel avant le RDV, paiement en ligne. Vous gérez juste votre agenda.',
    detail: 'Zéro appel manqué',
  },
] as const

export function HowItWorksSection() {
  return (
    <section
      className="px-6 py-24 lg:px-8"
      aria-labelledby="how-heading"
      style={{ background: 'rgba(37,49,34,0.04)' }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p
            className="mb-3 text-xs font-semibold tracking-widest uppercase"
            style={{ color: '#489B6E' }}
          >
            Comment ça marche
          </p>
          <h2
            id="how-heading"
            className="text-3xl font-black tracking-tight sm:text-4xl"
            style={{ color: '#253122' }}
          >
            De zéro à réservé
            <br />
            en moins de 10 minutes.
          </h2>
        </div>

        {/* Steps */}
        <ol className="relative" role="list">
          {/* Ligne verticale de connexion */}
          <div
            aria-hidden
            className="absolute top-10 bottom-10 left-[1.85rem] hidden w-px sm:block"
            style={{ background: 'linear-gradient(to bottom, #489B6E, rgba(72,155,110,0.1))' }}
          />

          <div className="flex flex-col gap-10">
            {steps.map((step, i) => (
              <li key={step.number} className="flex items-start gap-6 sm:gap-8">
                {/* Number bubble */}
                <div
                  className="relative flex size-[3.75rem] shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-sm"
                  style={{ background: i === 0 ? '#253122' : i === 1 ? '#489B6E' : '#C5A56E' }}
                  aria-hidden
                >
                  {step.number}
                </div>

                {/* Content */}
                <div className="flex-1 pt-3">
                  <h3 className="text-lg font-bold" style={{ color: '#253122' }}>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
                    {step.description}
                  </p>
                  <span
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: '#489B6E' }}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: '#489B6E' }} />
                    {step.detail}
                  </span>
                </div>
              </li>
            ))}
          </div>
        </ol>
      </div>
    </section>
  )
}
