'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// ── Types ──────────────────────────────────────────────────────────────────────

export type BookingDayData = {
  date: string
  bookings: number
  isFuture: boolean
}

type ViewMode = 'past7' | 'past30' | 'past90' | 'future7' | 'future30' | 'future90' | 'global'

const MODES: { key: ViewMode; label: string; group: 'past' | 'future' | 'global' }[] = [
  { key: 'past7', label: '7j', group: 'past' },
  { key: 'past30', label: '30j', group: 'past' },
  { key: 'past90', label: '90j', group: 'past' },
  { key: 'global', label: 'Vue globale', group: 'global' },
  { key: 'future7', label: '+7j', group: 'future' },
  { key: 'future30', label: '+30j', group: 'future' },
  { key: 'future90', label: '+90j', group: 'future' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

function filterData(data: BookingDayData[], mode: ViewMode) {
  const past = data.filter((d) => !d.isFuture)
  const future = data.filter((d) => d.isFuture)

  switch (mode) {
    case 'past7':
      return past.slice(-7)
    case 'past30':
      return past.slice(-30)
    case 'past90':
      return past
    case 'future7':
      return future.slice(0, 7)
    case 'future30':
      return future.slice(0, 30)
    case 'future90':
      return future
    case 'global':
    default:
      return [...past.slice(-30), ...future.slice(0, 30)]
  }
}

// ── Composant ──────────────────────────────────────────────────────────────────

export function ChartAreaInteractive({ data }: { data: BookingDayData[] }) {
  const [mode, setMode] = React.useState<ViewMode>('global')
  const isGlobal = mode === 'global'
  const today = new Date().toISOString().slice(0, 10)

  const filtered = React.useMemo(() => filterData(data, mode), [data, mode])

  // En mode global : deux séries distinctes (passé / futur)
  // Sinon : une seule série "rdv"
  const chartData = React.useMemo(() => {
    if (!isGlobal) {
      return filtered.map((d) => ({ date: d.date, rdv: d.bookings }))
    }
    return filtered.map((d) => ({
      date: d.date,
      passé: d.isFuture ? undefined : d.bookings,
      àVenir: d.isFuture ? d.bookings : undefined,
    }))
  }, [filtered, isGlobal])

  const total = filtered.reduce((s, d) => s + d.bookings, 0)
  const modeLabel = MODES.find((m) => m.key === mode)?.label ?? ''

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Réservations</CardTitle>
          <CardDescription>
            {total.toLocaleString('fr-FR')} RDV · {modeLabel}
          </CardDescription>
        </div>

        {/* Sélecteur de plage */}
        <div className="flex flex-wrap gap-1">
          {/* Groupe passé */}
          <div className="border-border flex overflow-hidden rounded-lg border text-xs">
            {MODES.filter((m) => m.group === 'past').map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-2.5 py-1.5 transition-colors ${
                  mode === m.key
                    ? 'bg-[#489B6E] font-semibold text-white'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Global */}
          <button
            onClick={() => setMode('global')}
            className={`border-border rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              mode === 'global'
                ? 'bg-[#489B6E] font-semibold text-white'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            Vue globale
          </button>

          {/* Groupe futur */}
          <div className="border-border flex overflow-hidden rounded-lg border text-xs">
            {MODES.filter((m) => m.group === 'future').map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-2.5 py-1.5 transition-colors ${
                  mode === m.key
                    ? 'bg-blue-500 font-semibold text-white'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={chartData as Array<Record<string, unknown>>}
            margin={{ left: 0, right: 4, top: 4, bottom: 0 }}
          >
            <defs>
              {/* Vert — passé */}
              <linearGradient id="grad-past" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#489B6E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#489B6E" stopOpacity={0} />
              </linearGradient>
              {/* Bleu — futur */}
              <linearGradient id="grad-future" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickFormatter={fmt}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={24}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value, name) => [
                value as number,
                name === 'rdv' ? 'RDV' : name === 'passé' ? 'Passé' : 'À venir',
              ]}
              labelFormatter={(label) => fmt(label as string)}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />

            {/* Mode global : ligne "Aujourd'hui" */}
            {isGlobal && (
              <ReferenceLine
                x={today}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{
                  value: "Aujourd'hui",
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))',
                }}
              />
            )}

            {isGlobal ? (
              <>
                {/* Passé — vert */}
                <Area
                  type="monotone"
                  dataKey="passé"
                  stroke="#489B6E"
                  strokeWidth={2}
                  fill="url(#grad-past)"
                  connectNulls={false}
                  dot={false}
                />
                {/* Futur — bleu pointillé */}
                <Area
                  type="monotone"
                  dataKey="àVenir"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  fill="url(#grad-future)"
                  connectNulls={false}
                  dot={false}
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="rdv"
                stroke={
                  MODES.find((m) => m.key === mode)?.group === 'future' ? '#3B82F6' : '#489B6E'
                }
                strokeWidth={2}
                fill={
                  MODES.find((m) => m.key === mode)?.group === 'future'
                    ? 'url(#grad-future)'
                    : 'url(#grad-past)'
                }
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
