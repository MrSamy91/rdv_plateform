import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { BecomeMemberForm } from '@/components/dashboard/become-member-form'

export default async function BecomeMemberPage() {
  const session = await requireSession('/client/become-member')

  const existingMember = await db.member.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (existingMember) {
    redirect('/member')
  }

  return <BecomeMemberForm userName={session.user.name ?? 'Professionnel'} />
}
