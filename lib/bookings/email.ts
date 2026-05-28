import {
  BookingConfirmationClientTemplate,
  BookingNotificationMemberTemplate,
  sendEmail,
} from '@/lib/email'
import { getServerAppUrl } from '@/lib/env'
import { db } from '@/lib/db'
import { formatDuration } from '@/lib/utils/format-duration'
import { formatPrice } from '@/lib/utils/format-price'

// Date du creneau formatee en UTC : TimeSlot.date est un @db.Date (minuit UTC),
// formater en fuseau local decalerait le jour. UTC garantit le bon jour partout.
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'UTC' })

/**
 * Envoie les deux emails de confirmation (client + professionnel) apres qu'un
 * booking a ete confirme. **Best-effort** : un echec d'envoi (Mailpit/Resend KO)
 * ne doit jamais faire echouer la confirmation du RDV ni casser les tests.
 * Le bloc paiement reste masque tant que Stripe n'est pas branche (aucun `payment` fourni).
 */
export async function sendBookingConfirmationEmails(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      totalPrice: true,
      client: { select: { name: true, email: true, phone: true } },
      service: { select: { name: true, duration: true } },
      timeSlot: { select: { date: true, startTime: true, endTime: true } },
      member: {
        select: {
          user: { select: { name: true, email: true } },
          organization: { select: { name: true, address: true, phone: true } },
        },
      },
    },
  })

  if (!booking) return

  const { client, service, timeSlot, member } = booking
  const org = member.organization

  // Chaines pretes a afficher : les templates restent purement presentationnels.
  const dateLabel = dateFormatter.format(timeSlot.date)
  const timeLabel = `${timeSlot.startTime} - ${timeSlot.endTime}`
  const durationLabel = formatDuration(service.duration)
  const priceLabel = formatPrice(booking.totalPrice)

  const appUrl = getServerAppUrl()
  const clientManageUrl = `${appUrl}/client/bookings`
  const memberManageUrl = `${appUrl}/member/calendar`

  try {
    await sendEmail({
      to: client.email,
      subject: `Votre rendez-vous chez ${org.name} est confirme`,
      react: BookingConfirmationClientTemplate({
        clientName: client.name,
        orgName: org.name,
        orgAddress: org.address,
        orgPhone: org.phone,
        memberName: member.user.name,
        serviceName: service.name,
        durationLabel,
        dateLabel,
        timeLabel,
        priceLabel,
        manageUrl: clientManageUrl,
      }),
      tags: [{ name: 'type', value: 'booking-confirmation-client' }],
    })
  } catch (error) {
    console.error('[booking] envoi email client echoue:', error)
  }

  try {
    await sendEmail({
      to: member.user.email,
      subject: `Nouveau RDV - ${dateLabel} a ${timeSlot.startTime}`,
      react: BookingNotificationMemberTemplate({
        memberName: member.user.name,
        orgName: org.name,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        serviceName: service.name,
        durationLabel,
        dateLabel,
        timeLabel,
        priceLabel,
        manageUrl: memberManageUrl,
      }),
      tags: [{ name: 'type', value: 'booking-notification-member' }],
    })
  } catch (error) {
    console.error('[booking] envoi email membre echoue:', error)
  }
}
