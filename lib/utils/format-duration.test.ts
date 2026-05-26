import { describe, expect, it } from 'vitest'
import { formatDuration } from './format-duration'

describe('formatDuration', () => {
  it('affiche les durees sous une heure en minutes', () => {
    expect(formatDuration(5)).toBe('5 min')
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(45)).toBe('45 min')
  })

  it('affiche une heure pile sans minutes', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
  })

  it('affiche les heures + minutes avec padding sur 2 chiffres', () => {
    expect(formatDuration(90)).toBe('1h30')
    expect(formatDuration(125)).toBe('2h05')
    expect(formatDuration(135)).toBe('2h15')
  })
})
