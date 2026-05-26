'use client'

import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import { trpc } from '@/lib/trpc/client'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function formatTime(date: Date) {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function MemberCalendarView() {
  const utils = trpc.useUtils()
  const eventsQuery = trpc.memberPortal.calendarEvents.useQuery()
  const calendarRef = useRef<FullCalendar | null>(null)

  // ── Responsive : vue Jour sur mobile, Semaine sur desktop ──────────────────
  // Lazy init pour éviter un setState synchrone dans useEffect (ESLint react-hooks/set-state-in-effect)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      calendarRef.current?.getApi().changeView(e.matches ? 'timeGridDay' : 'timeGridWeek')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addAvailability = trpc.memberPortal.addAvailability.useMutation({
    onSuccess: () => {
      toast.success('Créneau ajouté avec succès')
      utils.memberPortal.calendarEvents.invalidate()
      utils.memberPortal.availability.invalidate()
      calendarRef.current?.getApi().unselect()
    },
    onError: (error) => {
      toast.error(error.message)
      calendarRef.current?.getApi().unselect()
    },
  })

  const removeAvailability = trpc.memberPortal.removeAvailability.useMutation({
    onSuccess: () => {
      toast.success('Créneau supprimé avec succès')
      utils.memberPortal.calendarEvents.invalidate()
      utils.memberPortal.availability.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const clearDay = trpc.memberPortal.clearDayAvailabilities.useMutation({
    onSuccess: () => {
      toast.success('Journée vidée')
      utils.memberPortal.calendarEvents.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const applyWeek = trpc.memberPortal.applyDayToWeek.useMutation({
    onSuccess: () => {
      toast.success('Appliqué à la semaine')
      utils.memberPortal.calendarEvents.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const applyDayOfWeek = trpc.memberPortal.applyDayToDayOfWeek.useMutation({
    onSuccess: () => {
      toast.success('Appliqué aux semaines suivantes')
      utils.memberPortal.calendarEvents.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const applyMonth = trpc.memberPortal.applyDayToMonth.useMutation({
    onSuccess: () => {
      toast.success('Appliqué aux 30 prochains jours')
      utils.memberPortal.calendarEvents.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  // ── États UI ───────────────────────────────────────────────────────────────
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<
    ({ id: string } & Record<string, unknown>) | null
  >(null)

  // Modal mobile d'ajout de créneau
  const [mobileModal, setMobileModal] = useState<{ date: string } | null>(null)
  const [mobileStart, setMobileStart] = useState('09:00')
  const [mobileEnd, setMobileEnd] = useState('10:00')

  // ── Formatage des événements ───────────────────────────────────────────────
  const calendarEvents = useMemo(() => {
    return (eventsQuery.data ?? []).map((slot) => {
      if (slot.isAvailable) {
        return {
          id: slot.id,
          start: slot.start,
          end: slot.end,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          extendedProps: { type: 'availability', slot },
        }
      } else {
        return {
          id: slot.id,
          start: slot.start,
          end: slot.end,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          extendedProps: { type: 'booking', slot },
        }
      }
    })
  }, [eventsQuery.data])

  const handleSelect = useCallback(
    (info: DateSelectArg) => {
      const dateStr = formatDate(info.start)
      const startTimeStr = formatTime(info.start)
      const endTimeStr = formatTime(info.end)

      if (info.start.getTime() < Date.now() - 15 * 60 * 1000) {
        toast.error('Impossible de sélectionner un horaire dans le passé.')
        calendarRef.current?.getApi().unselect()
        return
      }

      addAvailability.mutate({ date: dateStr, startTime: startTimeStr, endTime: endTimeStr })
    },
    [addAvailability],
  )

  const handleEventClick = useCallback((info: EventClickArg) => {
    const { type, slot } = info.event.extendedProps

    if (type === 'availability') {
      setMenuPosition({ x: info.jsEvent.clientX, y: info.jsEvent.clientY })
      setSelectedSlot(slot)
    } else {
      toast.info(`Réservation pour ${slot.booking.clientName}`)
    }
  }, [])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (eventsQuery.isLoading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    )
  }

  // ── CSS commun ─────────────────────────────────────────────────────────────
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid rgba(37,49,34,0.18)',
    borderRadius: '0.625rem',
    fontSize: '1rem',
    color: '#253122',
    boxSizing: 'border-box',
  }

  return (
    <div className="@container/main flex h-full flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* En-tête */}
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#253122' }}>
          Agenda
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isMobile
            ? 'Appuyez sur un créneau vert pour le supprimer.'
            : 'Sélectionnez des plages horaires (glissez-déposez) pour ouvrir vos disponibilités. Cliquez sur un créneau vert pour le supprimer.'}
        </p>

        {/* Bouton mobile pour ajouter un créneau */}
        {isMobile && (
          <button
            id="mobile-add-slot-btn"
            onClick={() => {
              setMobileModal({ date: formatDate(new Date()) })
              setMobileStart('09:00')
              setMobileEnd('10:00')
            }}
            style={{
              marginTop: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: '#489B6E',
              color: '#fff',
              border: 'none',
              borderRadius: '0.625rem',
              padding: '0.6rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            + Ajouter un créneau
          </button>
        )}
      </div>

      {/* Calendrier */}
      <div className="min-h-[600px] flex-1 px-4 lg:px-6">
        <div className="h-full rounded-2xl border bg-white p-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] sm:p-5">
          <style>{`
            .fc {
              --fc-border-color: rgba(37, 49, 34, 0.08);
              --fc-button-text-color: #253122;
              --fc-button-bg-color: #fff;
              --fc-button-border-color: rgba(37, 49, 34, 0.15);
              --fc-button-hover-bg-color: #f8fafc;
              --fc-button-hover-border-color: rgba(37, 49, 34, 0.25);
              --fc-button-active-bg-color: #253122;
              --fc-button-active-border-color: #253122;
              --fc-today-bg-color: rgba(72, 155, 110, 0.03);
              font-family: inherit;
            }
            .fc .fc-toolbar-title {
              font-size: clamp(0.9rem, 4vw, 1.25rem);
              font-weight: 800;
              color: #253122;
              text-transform: capitalize;
            }
            .fc .fc-button {
              border-radius: 0.5rem;
              text-transform: capitalize;
              font-weight: 600;
              font-size: clamp(0.75rem, 2.5vw, 0.875rem);
              padding: 0.35rem 0.6rem;
              transition: all 0.2s;
              box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            }
            @media (min-width: 640px) {
              .fc .fc-button { padding: 0.4rem 1rem; }
            }
            .fc .fc-button-primary:not(:disabled).fc-button-active,
            .fc .fc-button-primary:not(:disabled):active {
              color: white;
            }
            .fc-theme-standard th {
              border-bottom: 2px solid rgba(37, 49, 34, 0.1);
              padding: 10px 0;
            }
            .fc-col-header-cell-cushion {
              font-weight: 700;
              color: #253122;
              text-transform: capitalize;
            }
            .fc-timegrid-slot-minor {
              border-top-style: dashed !important;
              border-color: rgba(37, 49, 34, 0.05) !important;
            }
            .fc-highlight {
              background: rgba(72, 155, 110, 0.15) !important;
              border: 2px dashed #489B6E;
              border-radius: 6px;
            }
            .fc-event {
              border: none !important;
              background: transparent !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
            .fc-event-main { height: 100%; width: 100%; padding: 2px; }
            .fc-v-event { background-color: transparent !important; border: none !important; }
            /* Empêche le scroll de la page lors du glisser dans le calendrier sur mobile */
            .fc-timegrid-body { touch-action: none; }
          `}</style>

          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
            customButtons={{
              saveBtn: {
                text: 'Sauvegarder',
                click: () => {
                  toast.success(
                    'Vos horaires sont déjà sauvegardés automatiquement à chaque modification !',
                    { icon: '✅' },
                  )
                },
              },
            }}
            headerToolbar={{
              left: isMobile ? 'prev,next today' : 'saveBtn prev,next today',
              center: 'title',
              right: isMobile ? 'timeGridDay' : 'timeGridWeek,timeGridDay',
            }}
            buttonText={{ today: "Aujourd'hui", week: 'Semaine', day: 'Jour' }}
            locale="fr"
            firstDay={1}
            navLinks={true}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            events={calendarEvents}
            selectable={!isMobile}
            selectMirror={!isMobile}
            selectOverlap={false}
            longPressDelay={isMobile ? 500 : 0}
            select={handleSelect}
            eventClick={handleEventClick}
            height="100%"
            slotDuration="00:15:00"
            slotLabelInterval="01:00"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              omitZeroMinute: false,
              meridiem: 'short',
            }}
            dayHeaderContent={(arg) => {
              const dateStr = formatDate(arg.date)
              const dayNamePlural = arg.date.toLocaleDateString('fr-FR', { weekday: 'long' }) + 's'

              if (isMobile) {
                return (
                  <div className="flex w-full items-center justify-center px-1">
                    <span className="text-xs font-bold" style={{ color: '#253122' }}>
                      {arg.text}
                    </span>
                  </div>
                )
              }

              return (
                <div className="flex w-full items-center justify-center gap-2 px-1">
                  <span className="text-sm">{arg.text}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 rounded-xl border-slate-200 shadow-lg"
                    >
                      <DropdownMenuLabel className="font-semibold text-slate-800">
                        Actions (Rapide)
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer font-medium"
                        onClick={() => {
                          const id = toast.loading('Application à la semaine...')
                          applyWeek.mutate(
                            { date: dateStr },
                            { onSettled: () => toast.dismiss(id) },
                          )
                        }}
                      >
                        Appliquer à la semaine
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer font-medium"
                        onClick={() => {
                          const id = toast.loading(`Application aux ${dayNamePlural}...`)
                          applyDayOfWeek.mutate(
                            { date: dateStr },
                            { onSettled: () => toast.dismiss(id) },
                          )
                        }}
                      >
                        Appliquer à tous les {dayNamePlural}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer font-medium"
                        onClick={() => {
                          const id = toast.loading('Application au mois...')
                          applyMonth.mutate(
                            { date: dateStr },
                            { onSettled: () => toast.dismiss(id) },
                          )
                        }}
                      >
                        Appliquer aux 30 prochains jours
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
                        onClick={() => {
                          const id = toast.loading('Suppression...')
                          clearDay.mutate({ date: dateStr }, { onSettled: () => toast.dismiss(id) })
                        }}
                      >
                        Vider la journée
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            }}
            eventContent={(eventInfo) => {
              const { type, slot } = eventInfo.event.extendedProps

              if (!slot) return null

              const isPast = new Date(slot.end) < new Date()

              if (type === 'availability') {
                return (
                  <div
                    className={`flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 transition-colors ${
                      isPast
                        ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60'
                        : 'border-green-500/30 bg-green-500/10 text-green-700 hover:border-green-500/50 hover:bg-green-500/20'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold tracking-wider uppercase ${isPast ? 'line-through' : ''}`}
                    >
                      {isPast ? 'Terminé' : 'Libre'}
                    </span>
                    <span
                      className={`mt-0.5 text-[10px] font-medium opacity-70 ${isPast ? 'line-through' : ''}`}
                    >
                      {eventInfo.timeText}
                    </span>
                  </div>
                )
              } else {
                return (
                  <div
                    className={`flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg p-2 shadow-md transition-transform ${
                      isPast
                        ? 'border-2 border-slate-300 bg-slate-300 text-slate-500 opacity-70'
                        : 'bg-slate-800 text-white hover:scale-[1.02]'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <div
                        className={`h-2 w-2 rounded-full ${isPast ? 'bg-slate-400' : 'bg-green-400'}`}
                      />
                      <span
                        className={`truncate text-xs font-bold ${isPast ? 'line-through' : ''}`}
                      >
                        {slot.booking?.clientName}
                      </span>
                    </div>
                    <span
                      className={`truncate text-[10px] font-medium ${isPast ? 'text-slate-500 line-through' : 'text-slate-300'}`}
                    >
                      {slot.booking?.serviceName}
                    </span>
                    <span
                      className={`mt-auto text-[10px] font-medium ${isPast ? 'text-slate-400 line-through' : 'text-slate-400'}`}
                    >
                      {eventInfo.timeText}
                    </span>
                  </div>
                )
              }
            }}
          />
        </div>
      </div>

      {/* Menu contextuel (clic sur un créneau) */}
      {menuPosition && selectedSlot && (
        <DropdownMenu
          open={!!menuPosition}
          onOpenChange={(open) => {
            if (!open) {
              setMenuPosition(null)
              setSelectedSlot(null)
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <div
              style={{
                position: 'fixed',
                left: menuPosition.x,
                top: menuPosition.y,
                pointerEvents: 'none',
              }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl border-slate-200 shadow-lg">
            <DropdownMenuLabel className="font-semibold text-slate-800">
              Options du créneau
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                toast.info(
                  "La modification directe arrive bientôt. Pour l'instant, supprimez et recréez.",
                )
                setMenuPosition(null)
              }}
              className="cursor-pointer"
            >
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
              onClick={() => {
                removeAvailability.mutate({ slotId: selectedSlot.id })
                setMenuPosition(null)
              }}
            >
              Supprimer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-slate-500"
              onClick={() => setMenuPosition(null)}
            >
              Annuler
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Modal mobile : ajouter un créneau (bottom sheet) */}
      {mobileModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileModal(null)
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '1.25rem 1.25rem 0 0',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.125rem', color: '#253122' }}>
              Ajouter un créneau
            </h2>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#253122' }}>
                Date
              </label>
              <input
                id="mobile-slot-date"
                type="date"
                value={mobileModal.date}
                onChange={(e) => setMobileModal({ date: e.target.value })}
                style={fieldStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#253122' }}>
                  Début
                </label>
                <input
                  id="mobile-slot-start"
                  type="time"
                  value={mobileStart}
                  onChange={(e) => setMobileStart(e.target.value)}
                  step={900}
                  style={fieldStyle}
                />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#253122' }}>
                  Fin
                </label>
                <input
                  id="mobile-slot-end"
                  type="time"
                  value={mobileEnd}
                  onChange={(e) => setMobileEnd(e.target.value)}
                  step={900}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setMobileModal(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(37,49,34,0.06)',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  color: '#253122',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                id="mobile-slot-confirm"
                onClick={() => {
                  if (!mobileModal.date || !mobileStart || !mobileEnd) return
                  if (mobileStart >= mobileEnd) {
                    toast.error("L'heure de fin doit être après l'heure de début.")
                    return
                  }
                  addAvailability.mutate({
                    date: mobileModal.date,
                    startTime: mobileStart,
                    endTime: mobileEnd,
                  })
                  setMobileModal(null)
                }}
                disabled={addAvailability.isPending}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#489B6E',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  color: '#fff',
                  cursor: 'pointer',
                  opacity: addAvailability.isPending ? 0.6 : 1,
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
