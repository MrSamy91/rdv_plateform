import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { OrganizationCreator } from '@/components/dashboard/organization-creator'

export const metadata: Metadata = { title: 'Créer mon organisation - CutBook' }

export default async function CreateOrganizationPage() {
  const session = await requireSession('/client/create-organization')

  // Un user ne peut gérer qu'une seule orga : s'il est déjà membre, on l'envoie sur son espace.
  const existingMember = await db.member.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (existingMember) {
    redirect('/member')
  }

  return <OrganizationCreator userName={session.user.name ?? 'Professionnel'} />
}
