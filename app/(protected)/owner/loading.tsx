// Skeleton de chargement — espace gérant (/owner)
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-black/[.06] ${className ?? ''}`} aria-hidden />
  )
}

export default function OwnerLoading() {
  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8" aria-label="Chargement…" aria-busy>
      <section>
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-black/[.06] bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </section>
    </div>
  )
}
