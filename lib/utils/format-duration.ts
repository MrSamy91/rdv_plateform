/**
 * Formate une duree en minutes pour l'affichage humain.
 * Ex : 30 -> "30 min", 60 -> "1h", 90 -> "1h30", 125 -> "2h05".
 * Utilise par les vues services (membre + gerant).
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}
