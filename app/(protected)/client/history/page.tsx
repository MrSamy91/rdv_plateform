import type { Metadata } from 'next'
import { ClientHistoryView } from '@/components/dashboard/client-history-view'

export const metadata: Metadata = {
  title: 'Historique - CutBook',
}

export default function ClientHistoryPage() {
  return <ClientHistoryView />
}
