import Link from 'next/link'
import { Scissors } from 'lucide-react'

interface AuthBrandPanelProps {
  title: string
  highlight: string
  description: string
  stats?: Array<{
    value: string
    label: string
  }>
}

export function AuthBrandPanel({ title, highlight, description, stats }: AuthBrandPanelProps) {
  return (
    <aside
      className="hidden flex-col justify-between p-12 lg:flex lg:w-[45%]"
      style={{ background: '#253122' }}
    >
      <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-85">
        <div
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ background: '#489B6E' }}
        >
          <Scissors size={15} className="rotate-90 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">CutBook</span>
      </Link>

      <div>
        <h2 className="text-2xl leading-tight font-black text-white">
          {title}
          <br />
          <span style={{ color: '#C5A56E' }}>{highlight}</span>
        </h2>
        <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {description}
        </p>

        {stats && (
          <div className="mt-8 flex gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-black" style={{ color: '#C5A56E' }}>
                  {stat.value}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2" aria-hidden>
        {['#253122', '#489B6E', '#C5A56E'].map((color) => (
          <div
            key={color}
            className="size-3 rounded-full opacity-60"
            style={{ background: color }}
          />
        ))}
      </div>
    </aside>
  )
}
