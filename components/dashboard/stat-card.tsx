import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn('bg-card flex flex-col gap-3 rounded-xl border p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
          <Icon className="text-primary size-5" />
        </div>
      </div>

      <div>
        <p className="text-foreground text-2xl font-bold">{value}</p>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>

      {trend && (
        <p
          className={cn(
            'text-xs font-medium',
            trend.positive ? 'text-primary' : 'text-destructive',
          )}
        >
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  )
}
