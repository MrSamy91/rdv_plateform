import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { BecomeMemberForm } from '@/components/dashboard/become-member-form'

export default async function BecomeMemberPage() {
  const session = await getSession()

  // Sécurité supplémentaire (le layout (protected) gère déjà ça)
  if (!session) {
    redirect('/login?callbackUrl=/become-member')
  }

  // Si déjà membre → rediriger vers le dashboard membre
  const existingMember = await db.member.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (existingMember) {
    redirect('/member')
  }

  return <BecomeMemberForm userName={session.user.name ?? 'Professionnel'} />
}
