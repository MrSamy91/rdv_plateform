'use client'

// Provider tRPC + TanStack Query pour les composants client.
// A wrapper autour des composants qui utilisent `trpc.xxx.useQuery()`.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'
import superjson from 'superjson'
import type { AppRouter } from './routers'

export const trpc = createTRPCReact<AppRouter>()

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min — refetch auto apres
            refetchOnWindowFocus: false,
            retry(failureCount, error) {
              const status = (error as { data?: { httpStatus?: number } }).data?.httpStatus

              if (status === 401 || status === 403) {
                return false
              }

              return failureCount < 2
            },
          },
        },
      }),
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
