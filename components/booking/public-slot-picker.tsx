'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { getPublicOrgBookingConfirmHref } from '@/lib/routes/organization-public-route'

interface PublicSlotPickerProps {
  orgSlug: string
  serviceId?: string
  memberId?: string
  dates: Array<{
    key: string
    weekday: string
    day: string
    isAvailable: boolean
  }>
  slots: Array<{
    id: string
    dateKey: string
    startTime: string
    endTime: string
    isAvailable: boolean
    memberName: string
  }>
}

export function PublicSlotPicker({
  orgSlug,
  serviceId,
  memberId,
  dates,
  slots,
}: PublicSlotPickerProps) {
  const firstAvailableDateKey = dates.find((date) => date.isAvailable)?.key ?? dates[0]?.key ?? ''
  const [selectedDateKey, setSelectedDateKey] = useState(firstAvailableDateKey)
  const selectedSlots = useMemo(
    () => slots.filter((slot) => slot.dateKey === selectedDateKey),
    [selectedDateKey, slots],
  )

  return (
    <>
      <section aria-labelledby="date-heading">
        <h2 id="date-heading" className="mb-4 text-sm font-semibold text-slate-800">
          Selectionnez une date
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => {
            const isSelected = date.key === selectedDateKey && date.isAvailable

            return (
              <button
                key={date.key}
                type="button"
                disabled={!date.isAvailable}
                aria-disabled={!date.isAvailable}
                aria-pressed={isSelected}
                onClick={() => setSelectedDateKey(date.key)}
                className={
                  date.isAvailable
                    ? isSelected
                      ? 'focus-visible:ring-ring/30 flex min-w-[4rem] flex-col items-center rounded-lg border-2 border-green-500 bg-green-50 px-3 py-2.5 text-green-500 transition-all hover:border-green-600 hover:bg-green-600 hover:text-white focus-visible:ring-2 focus-visible:outline-none'
                      : 'focus-visible:ring-ring/30 flex min-w-[4rem] flex-col items-center rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-700 transition-all hover:border-green-600 hover:bg-green-600 hover:text-white focus-visible:ring-2 focus-visible:outline-none'
                    : 'flex min-w-[4rem] cursor-not-allowed flex-col items-center rounded-lg border-2 border-slate-200 bg-slate-200 px-3 py-2.5 text-slate-400 line-through opacity-60'
                }
              >
                <span className="text-xs font-medium capitalize">{date.weekday}</span>
                <span className="text-base font-black">{date.day}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="slots-heading">
        <h2 id="slots-heading" className="mb-4 text-sm font-semibold text-slate-800">
          Creneaux disponibles
        </h2>
        {selectedSlots.length === 0 ? (
          <div className="border-border bg-card rounded-2xl border p-8 text-center">
            <p className="font-semibold text-slate-800">Aucun creneau disponible</p>
            <p className="mt-1 text-sm text-slate-500">
              Revenez plus tard ou contactez directement l&apos;etablissement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Creneaux disponibles">
            {selectedSlots.map((slot) =>
              slot.isAvailable ? (
                <Link
                  key={slot.id}
                  href={getPublicOrgBookingConfirmHref(orgSlug, {
                    service: serviceId,
                    member: memberId,
                    slot: slot.id,
                    time: slot.startTime,
                  })}
                  className="focus-visible:ring-ring/30 rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-700 transition-all duration-150 hover:border-green-600 hover:bg-green-600 hover:text-white focus-visible:border-green-600 focus-visible:ring-2 focus-visible:outline-none"
                  title={`${slot.memberName} - ${slot.endTime}`}
                >
                  {slot.startTime}
                </Link>
              ) : (
                <div
                  key={slot.id}
                  className="cursor-not-allowed rounded-lg border-2 border-slate-200 bg-slate-200 px-3 py-2.5 text-center text-sm text-slate-400 line-through opacity-60"
                  title="Creneau indisponible"
                  aria-disabled="true"
                >
                  {slot.startTime}
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </>
  )
}
