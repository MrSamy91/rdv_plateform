import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Mon espace - CutBook',
  description: 'Espace client CutBook.',
}

export default async function ClientPage() {
  const session = await getSession()
  const firstName = session?.user.name.split(' ')[0] ?? session?.user.name ?? 'client'

  return (
    <main className="bg-background min-h-svh px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-muted-foreground text-sm font-medium">Espace client</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal">Bonjour, {firstName}</h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Votre espace client est pret a recevoir les prochaines pages de reservation et de suivi.
        </p>
      </div>
    </main>
  )
}
