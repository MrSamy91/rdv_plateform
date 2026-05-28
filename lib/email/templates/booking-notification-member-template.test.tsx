import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BookingNotificationMemberTemplate } from './booking-notification-member-template'

const baseProps = {
  memberName: 'Mila Laurent',
  orgName: 'Studio Olive',
  clientName: 'Sam Client',
  clientEmail: 'sam@example.com',
  serviceName: 'Coupe homme',
  durationLabel: '1h',
  dateLabel: 'jeudi 28 mai 2026',
  timeLabel: '09:00 - 10:00',
  priceLabel: '25,00 €',
  manageUrl: 'https://cutbook.test/member/calendar',
}

describe('BookingNotificationMemberTemplate', () => {
  it('affiche le recap et les coordonnees du client', () => {
    const html = renderToStaticMarkup(<BookingNotificationMemberTemplate {...baseProps} />)

    expect(html).toContain('Sam Client')
    expect(html).toContain('sam@example.com')
    expect(html).toContain('Coupe homme')
    expect(html).toContain('jeudi 28 mai 2026')
    expect(html).toContain(baseProps.manageUrl)
  })

  it('affiche le telephone du client quand il est renseigne', () => {
    const html = renderToStaticMarkup(
      <BookingNotificationMemberTemplate {...baseProps} clientPhone="06 11 22 33 44" />,
    )

    expect(html).toContain('06 11 22 33 44')
    expect(html).toContain('Telephone')
  })

  it('masque la ligne telephone quand le client n a pas de numero', () => {
    const html = renderToStaticMarkup(<BookingNotificationMemberTemplate {...baseProps} />)

    expect(html).not.toContain('Telephone')
  })
})
