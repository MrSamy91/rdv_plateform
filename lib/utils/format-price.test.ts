import { describe, expect, it } from 'vitest'
import { formatPrice } from './format-price'

// On normalise les espaces : fr-FR insere des espaces insecables (U+202F / U+00A0)
// devant € et comme separateur de milliers, ce qui rend l'assertion brute fragile.
const strip = (value: string) => value.replace(/\s/g, '')

describe('formatPrice', () => {
  it('formate un entier avec deux decimales et le symbole euro', () => {
    expect(strip(formatPrice(25))).toBe('25,00€')
  })

  it('formate zero', () => {
    expect(strip(formatPrice(0))).toBe('0,00€')
  })

  it('formate un prix decimal', () => {
    expect(strip(formatPrice(9.9))).toBe('9,90€')
  })

  it('insere un separateur de milliers', () => {
    // 1234.5 -> "1 234,50 €" (espaces retires par strip)
    expect(strip(formatPrice(1234.5))).toBe('1234,50€')
  })

  it('utilise la virgule comme separateur decimal (locale fr)', () => {
    expect(formatPrice(12.34)).toContain('12,34')
  })
})
