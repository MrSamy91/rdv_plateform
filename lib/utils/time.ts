/**
 * Convertit une heure au format "HH:mm" en minutes depuis minuit.
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/**
 * Convertit un nombre de minutes depuis minuit en heure au format "HH:mm".
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Ajoute un nombre de minutes a une heure au format "HH:mm".
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  return minutesToTime(timeToMinutes(timeStr) + minutesToAdd)
}
