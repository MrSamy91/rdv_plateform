import { requireOwner } from '@/lib/auth'
import { OwnerServicesView } from '@/components/dashboard/owner-services-view'

export default async function OwnerServicesPage() {
  // requireOwner() : garde + récupère l'orga du propriétaire (déjà résolu par le layout, cache).
  const { organization } = await requireOwner()

  return <OwnerServicesView orgId={organization.id} />
}
