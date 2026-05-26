import { db } from '@/lib/db'

// ── Queries ─────────────────────────────────────────────────────────────────
//
// Le catalogue de services appartient a l'ORGANISATION et est gere par le owner
// (voir serviceRouter). Le membre ne fait que CONSULTER les services qui lui sont
// assignes via la table de jointure MemberService : il ne cree ni ne supprime rien
// lui-meme. C'est le owner qui decide quels services chaque membre propose.

export async function getMemberAssignedServices(userId: string) {
  const member = await db.member.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!member) return null

  const assignments = await db.memberService.findMany({
    where: { memberId: member.id },
    select: {
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return assignments.map((assignment) => assignment.service)
}
