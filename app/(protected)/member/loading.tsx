// Skeleton de chargement — layout member dashboard
// Reflète la structure de (protected)/member/page.tsx

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-black/[.06] ${className ?? ''}`}
      aria-hidden
    />
  )
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[.06] bg-white p-6">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

export default function MemberDashboardLoading() {
  return (
    <div className="space-y-8" aria-label="Chargement…" aria-busy>
      {/* Accueil pro */}
      <section>
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </section>

      {/* Stats */}
      <section>
        <Skeleton className="mb-3 h-3 w-28" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Prochains rendez-vous */}
      <section>
        <Skeleton className="mb-3 h-3 w-44" />
        <div className="space-y-2 rounded-2xl border border-black/[.06] bg-white p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl p-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
