'use client'

import * as React from 'react'
import { CheckIcon, ChevronDownIcon, LoaderCircleIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateUserRole } from './actions'
import { Role } from '@/generated/prisma/enums'

// ── Config des rôles ───────────────────────────────────────────────────────────

const roles: {
  value: Role
  label: string
  dot: string
  pill: string
  hover: string
}[] = [
  {
    value: 'ADMIN',
    label: 'Admin',
    dot: 'bg-amber-400',
    pill: 'bg-amber-50 text-amber-600 ring-amber-200',
    hover: 'hover:bg-amber-50/60',
  },
  {
    value: 'CLIENT',
    label: 'Client',
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-600 ring-slate-200',
    hover: 'hover:bg-slate-50',
  },
]

function getRoleConfig(role: Role) {
  return roles.find((r) => r.value === role) ?? roles[0]!
}

// ── Composant ──────────────────────────────────────────────────────────────────

export function RoleSelect({ userId, currentRole }: { userId: string; currentRole: Role }) {
  const [role, setRole] = React.useState<Role>(currentRole)
  const [pending, startTransition] = React.useTransition()
  const config = getRoleConfig(role)

  function handleSelect(next: Role) {
    if (next === role) return
    setRole(next) // optimistic update
    startTransition(async () => {
      await updateUserRole(userId, next)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={pending}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-all duration-150 select-none ring-inset focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 ${config.pill} `}
        >
          {pending ? (
            <LoaderCircleIcon size={10} className="shrink-0 animate-spin" />
          ) : (
            <span className={`size-1.5 shrink-0 rounded-full ${config.dot}`} />
          )}
          {config.label}
          <ChevronDownIcon size={11} className="ml-0.5 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-36 rounded-xl p-1 shadow-lg">
        {roles.map((r) => {
          const isActive = r.value === role
          return (
            <DropdownMenuItem
              key={r.value}
              onSelect={() => handleSelect(r.value)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-100 ${isActive ? 'font-semibold' : 'text-muted-foreground font-normal'} ${r.hover} `}
            >
              {/* Dot coloré */}
              <span className={`size-2 shrink-0 rounded-full ${r.dot}`} />
              {r.label}
              {/* Check sur l'item actif */}
              {isActive && <CheckIcon size={13} className="ml-auto text-current opacity-70" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
