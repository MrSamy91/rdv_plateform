import type { LucideIcon } from 'lucide-react'

interface MemberPlaceholderViewProps {
  title: string
  icon: LucideIcon
  headline: string
  description: string
}

export function MemberPlaceholderView({
  title,
  icon: Icon,
  headline,
  description,
}: MemberPlaceholderViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="bg-card flex min-h-[400px] flex-col items-center justify-center rounded-xl border p-10 text-center">
        <Icon size={40} className="text-muted-foreground/30 mb-4" />
        <p className="font-semibold">{headline}</p>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
    </div>
  )
}
