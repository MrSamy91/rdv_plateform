import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BookingConfirmationClientTemplate } from './booking-confirmation-client-template'

const baseProps = {
  clientName: 'Sam Client',
  orgName: 'Studio Olive',
  orgAddress: '12 rue des Lilas, Paris',
  orgPhone: '01 23 45 67 89',
  memberName: 'Mila Laurent',
  serviceName: 'Coupe homme',
  durationLabel: '1h',
  dateLabel: 'jeudi 28 mai 2026',
  timeLabel: '09:00 - 10:00',
  priceLabel: '25,00 €',
  manageUrl: 'https://cutbook.test/client/bookings',
}

describe('BookingConfirmationClientTemplate', () => {
  it('affiche le recapitulatif complet du rendez-vous', () => {
    const html = renderToStaticMarkup(<BookingConfirmationClientTemplate {...baseProps} />)

    expect(html).toContain('jeudi 28 mai 2026')
    expect(html).toContain('09:00 - 10:00')
    expect(html).toContain('Coupe homme')
    expect(html).toContain('Mila Laurent')
    expect(html).toContain('Studio Olive')
    expect(html).toContain('12 rue des Lilas, Paris')
    expect(html).toContain('25,00 €')
    expect(html).toContain(baseProps.manageUrl)
  })

  it('affiche "a regler sur place" et masque le bloc paiement sans paiement en ligne', () => {
    const html = renderToStaticMarkup(<BookingConfirmationClientTemplate {...baseProps} />)

    expect(html).toContain('regler sur place')
    expect(html).not.toContain('Paiement regle en ligne')
  })

  it('affiche le bloc paiement et masque "a regler sur place" quand un paiement est fourni', () => {
    const html = renderToStaticMarkup(
      <BookingConfirmationClientTemplate
        {...baseProps}
        payment={{ amountLabel: '25,00 €', method: 'Carte bancaire', reference: 'pi_123' }}
      />,
    )

    expect(html).toContain('Paiement regle en ligne')
    expect(html).toContain('Carte bancaire')
    expect(html).toContain('pi_123')
    expect(html).not.toContain('regler sur place')
  })
})
