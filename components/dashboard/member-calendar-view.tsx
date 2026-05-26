'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
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

// Utilitaire pour extraire "HH:mm" d'une date (heure locale)
function formatTime(date: Date) {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// Utilitaire pour extraire "YYYY-MM-DD" d'une date (heure locale)
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

  // Actions en masse
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

  // États pour le menu déroulant
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<
    ({ id: string } & Record<string, unknown>) | null
  >(null)

  // Formatage des événements pour FullCalendar avec mise en cache
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

      // Vérification de sécurité pour ne pas ajouter dans le passé (tolérance 15min)
      if (info.start.getTime() < Date.now() - 15 * 60 * 1000) {
        toast.error('Impossible de sélectionner un horaire dans le passé.')
        calendarRef.current?.getApi().unselect()
        return
      }

      addAvailability.mutate({
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
      })
    },
    [addAvailability],
  )

  const handleEventClick = useCallback((info: EventClickArg) => {
    const { type, slot } = info.event.extendedProps

    // On ne permet le clic que sur les disponibilités (pas sur les réservations)
    if (type === 'availability') {
      // Calculer la position pour le menu (utiliser la position de la souris)
      setMenuPosition({
        x: info.jsEvent.clientX,
        y: info.jsEvent.clientY,
      })
      setSelectedSlot(slot)
    } else {
      toast.info(`Réservation pour ${slot.booking.clientName}`)
    }
  }, [])

  if (eventsQuery.isLoading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="@container/main flex h-full flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#253122' }}>
          Agenda hebdomadaire
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sélectionnez des plages horaires (glissez-déposez) pour ouvrir vos disponibilités. Cliquez
          sur un créneau vert pour le supprimer.
        </p>
      </div>

      <div className="min-h-[600px] flex-1 px-4 lg:px-6">
        <div className="h-full rounded-2xl border bg-white p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
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
              font-size: 1.25rem;
              font-weight: 800;
              color: #253122;
              text-transform: capitalize;
            }
            .fc .fc-button {
              border-radius: 0.5rem;
              text-transform: capitalize;
              font-weight: 600;
              font-size: 0.875rem;
              padding: 0.4rem 1rem;
              transition: all 0.2s;
              box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
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
            /* Reset native events */
            .fc-event {
              border: none !important;
              background: transparent !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
            .fc-event-main {
              height: 100%;
              width: 100%;
              padding: 2px;
            }
            .fc-v-event {
              background-color: transparent !important;
              border: none !important;
            }
          `}</style>

          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            customButtons={{
              saveBtn: {
                text: 'Sauvegarder',
                click: () => {
                  toast.success(
                    'Vos horaires sont déjà sauvegardés automatiquement à chaque modification !',
                    {
                      icon: '✅',
                    },
                  )
                },
              },
            }}
            headerToolbar={{
              left: 'saveBtn prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay',
            }}
            buttonText={{
              today: "Aujourd'hui",
              week: 'Semaine',
              day: 'Jour',
            }}
            locale="fr"
            firstDay={1}
            navLinks={true}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            events={calendarEvents}
            selectable={true}
            selectMirror={true}
            selectOverlap={false}
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

              return (
                <div className="flex w-full items-center justify-center gap-2 px-1">
                  <span>{arg.text}</span>
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
                            {
                              onSettled: () => toast.dismiss(id),
                            },
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
                            {
                              onSettled: () => toast.dismiss(id),
                            },
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
                            {
                              onSettled: () => toast.dismiss(id),
                            },
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
                          clearDay.mutate(
                            { date: dateStr },
                            {
                              onSettled: () => toast.dismiss(id),
                            },
                          )
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

              // Protection contre les événements de sélection temporaires de FullCalendar
              if (!slot) return null

              // Déterminer si le créneau est passé
              // slot.end est sous la forme "YYYY-MM-DDT12:00:00" (sans fuseau, donc local)
              // new Date() est aussi local, la comparaison est donc correcte.
              const isPast = new Date(slot.end) < new Date()

              if (type === 'availability') {
                return (
                  <div
                    className={`flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 transition-colors ${
                      isPast
                        ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60' // Grisé si passé
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
                      ></div>
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

      {/* Menu déroulant pour gérer les créneaux */}
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
    </div>
  )
}
