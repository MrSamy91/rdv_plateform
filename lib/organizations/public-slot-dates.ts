export function listPublicSlotDates(
  slots: Array<{
    date: Date
    isAvailable?: boolean
  }>,
) {
  const dates = new Map<string, { date: Date; isAvailable: boolean }>()

  for (const slot of slots) {
    const dateKey = slot.date.toISOString().slice(0, 10)
    const existingDate = dates.get(dateKey)

    dates.set(dateKey, {
      date: existingDate?.date ?? slot.date,
      isAvailable: Boolean(existingDate?.isAvailable || slot.isAvailable !== false),
    })
  }

  return Array.from(dates.entries()).map(([key, slot]) => ({
    key,
    weekday: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
      .format(slot.date)
      .replace('.', ''),
    day: new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(slot.date),
    isAvailable: slot.isAvailable,
  }))
}
