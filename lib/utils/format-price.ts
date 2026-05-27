/**
 * Formate un prix en euros selon la locale francaise.
 * Ex : 25 -> "25,00 €". Utilise par les vues services (membre + gerant).
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}
