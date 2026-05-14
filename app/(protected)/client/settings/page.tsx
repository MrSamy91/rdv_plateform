import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { SettingsClient } from '@/components/dashboard/client-settings-view'

export const metadata: Metadata = {
  title: 'Paramètres — CutBook',
  description: 'Gérez votre compte, mot de passe et préférences.',
}

export default async function SettingsPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  return (
    <SettingsClient
      currentEmail={session.user.email}
      name={session.user.name ?? 'Utilisateur'}
    />
  )
}
