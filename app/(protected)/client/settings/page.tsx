import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { SettingsClient } from './settings-client'

export const metadata: Metadata = {
  title: 'Paramètres — CutBook',
  description: 'Gérez vos informations personnelles et la sécurité de votre compte.',
}

export default async function ClientSettingsPage() {
  // getSession() est cachée (React.cache) — 0 requête supplémentaire vs le layout
  const session = await getSession()
  const email = session!.user.email

  return <SettingsClient currentEmail={email} />
}
