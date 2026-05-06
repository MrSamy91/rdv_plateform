import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowDown,
  CalendarCheck,
  Check,
  Clock3,
  CreditCard,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'CutBook - Plateforme de reservation en construction',
  description:
    'CutBook est une future plateforme de reservation en ligne pour les professionnels : planning, rendez-vous, paiement, notifications et fidelite.',
  openGraph: {
    title: 'CutBook - Plateforme de reservation en construction',
    description:
      'Presentation du projet CutBook, une solution de reservation en ligne pour professionnels actuellement en developpement.',
  },
  twitter: {
    title: 'CutBook - Plateforme de reservation en construction',
    description:
      'Decouvrez le projet CutBook avant son lancement : reservation, planning et outils pour professionnels.',
  },
}

const audiences = [
  'Salons de coiffure et barbers',
  'Instituts de beaute et bien-etre',
  'Coachs, studios et independants',
  'Cabinets recevant sur rendez-vous',
]

const modules = [
  {
    icon: CalendarCheck,
    title: 'Reservation en ligne',
    text: 'Les clients pourront choisir un service, un professionnel et un creneau disponible.',
  },
  {
    icon: Clock3,
    title: 'Planning equipe',
    text: 'Les professionnels auront une vue claire des rendez-vous, disponibilites et annulations.',
  },
  {
    icon: CreditCard,
    title: 'Paiement securise',
    text: 'Le paiement et les acomptes seront prevus via Stripe pour limiter les rendez-vous manques.',
  },
  {
    icon: MailCheck,
    title: 'Notifications',
    text: 'Confirmations, rappels et messages importants seront envoyes automatiquement.',
  },
]

const roadmap = [
  'Authentification client et professionnel',
  'Pages publiques des etablissements',
  'Parcours complet de prise de rendez-vous',
  'Dashboards client, membre et responsable',
  'Paiement, avis et programme fidelite',
]

const previewSlots = [
  { time: '09:00', label: 'Coupe homme', state: 'Bientot' },
  { time: '10:30', label: 'Balayage', state: 'Prototype' },
  { time: '14:00', label: 'Soin visage', state: 'Planifie' },
]

export default function Home() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
        <nav
          aria-label="Navigation principale"
          className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </span>
            <span>CutBook</span>
          </Link>

          <div className="text-muted-foreground hidden items-center gap-6 text-sm font-medium lg:flex">
            <a href="#" className="hover:text-foreground transition-colors">
              Accueil
            </a>
            <a href="#projet" className="hover:text-foreground transition-colors">
              Le projet
            </a>
            <a href="#modules" className="hover:text-foreground transition-colors">
              Fonctionnalites
            </a>
            <a href="#pour-qui" className="hover:text-foreground transition-colors">
              Pour qui
            </a>
            <a href="#avancement" className="hover:text-foreground transition-colors">
              Avancement
            </a>
          </div>

          <span className="bg-secondary text-secondary-foreground rounded-lg border px-3 py-2 text-sm font-medium">
            Bientot disponible
          </span>
        </nav>
      </header>

      <section className="border-b bg-slate-50">
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl content-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="bg-background text-muted-foreground mb-6 inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
              <Sparkles className="text-accent size-4" aria-hidden="true" />
              Plateforme en cours de developpement
            </div>

            <h1 className="max-w-4xl text-5xl font-extrabold tracking-normal sm:text-6xl lg:text-7xl">
              CutBook prepare la reservation en ligne des professionnels.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-xl leading-8">
              Notre objectif est simple : permettre a un client de prendre rendez-vous en quelques
              minutes, et donner aux professionnels un outil clair pour gerer leur planning, leur
              equipe, leurs paiements et leur relation client.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-5 text-base">
                <a href="#projet">
                  Comprendre le projet
                  <ArrowDown className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-5 text-base">
                <a href="#avancement">Voir ce qui arrive</a>
              </Button>
            </div>
          </div>

          <div className="flex items-center lg:justify-end">
            <div className="bg-card w-full max-w-xl rounded-lg border p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b pb-5">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Apercu du futur outil</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-normal">Planning CutBook</h2>
                </div>
                <span className="bg-accent text-accent-foreground rounded-lg px-3 py-2 text-sm font-semibold">
                  Preview
                </span>
              </div>

              <div className="grid gap-3 py-5">
                {previewSlots.map((slot) => (
                  <div
                    key={`${slot.time}-${slot.label}`}
                    className="bg-background grid grid-cols-[4.5rem_1fr] gap-3 rounded-lg border p-3"
                  >
                    <div className="text-primary flex items-center gap-2 text-sm font-semibold">
                      <Clock3 className="size-4" aria-hidden="true" />
                      {slot.time}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{slot.label}</p>
                        <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs font-medium">
                          {slot.state}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Creneau, service et professionnel synchronises.
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-slate-100 p-4">
                <p className="text-sm font-semibold">Ce site est une page temporaire.</p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  Les espaces client, professionnel et admin seront ajoutes progressivement pendant
                  le developpement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="projet" className="bg-background border-b py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-primary text-sm font-semibold uppercase">Le projet</p>
            <h2 className="mt-3 text-4xl font-bold tracking-normal">
              Une solution pour remplacer les rendez-vous disperses.
            </h2>
          </div>
          <div className="text-muted-foreground grid gap-6 text-lg leading-8">
            <p>
              Beaucoup de professionnels gerent encore leurs reservations entre appels, messageries,
              notes et agendas separes. CutBook vise a centraliser ce parcours dans une interface
              simple, lisible et accessible depuis le web.
            </p>
            <p>
              La plateforme est pensee pour plusieurs metiers : un etablissement pourra presenter
              ses services, afficher ses disponibilites, recevoir des reservations et suivre son
              activite depuis un dashboard.
            </p>
          </div>
        </div>
      </section>

      <section id="modules" className="border-b bg-slate-100 py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-primary text-sm font-semibold uppercase">Modules prevus</p>
            <h2 className="mt-3 text-4xl font-bold tracking-normal">
              Les briques principales de la future plateforme.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon

              return (
                <article key={module.title} className="bg-card rounded-lg border p-5">
                  <Icon className="text-primary size-6" aria-hidden="true" />
                  <h3 className="mt-5 text-xl font-semibold tracking-normal">{module.title}</h3>
                  <p className="text-muted-foreground mt-3 leading-7">{module.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="pour-qui" className="bg-background border-b py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-primary text-sm font-semibold uppercase">Pour qui</p>
            <h2 className="mt-3 text-4xl font-bold tracking-normal">
              Un socle adapte aux rendez-vous professionnels.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-2xl leading-8">
              CutBook part du cas salon de coiffure, mais son architecture est prevue pour rester
              assez flexible et accueillir d autres activites sur rendez-vous.
            </p>
          </div>

          <div className="grid gap-3">
            {audiences.map((audience) => (
              <div key={audience} className="bg-secondary flex items-center gap-3 rounded-lg p-4">
                <Check className="text-primary size-5" aria-hidden="true" />
                <span className="font-medium">{audience}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="avancement" className="bg-slate-950 py-20 text-slate-50">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-gold-300 text-sm font-semibold uppercase">Avancement</p>
            <h2 className="mt-3 text-4xl font-bold tracking-normal">
              La base technique est posee.
            </h2>
            <p className="mt-5 leading-8 text-slate-300">
              Le projet est en phase de construction. Cette page sert de presentation publique en
              attendant l ouverture des premiers parcours utilisables.
            </p>
          </div>

          <div className="grid gap-3">
            {roadmap.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-white/10 p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-300" aria-hidden="true" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-background border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-semibold">CutBook</p>
          <p className="text-muted-foreground">
            Projet de plateforme de reservation en ligne pour professionnels.
          </p>
        </div>
      </footer>
    </main>
  )
}
