import {
  BookingConfirmationClientTemplate,
  BookingNotificationMemberTemplate,
  PaymentReceiptTemplate,
  sendEmail,
} from '@/lib/email'
import { getServerAppUrl } from '@/lib/env'
import { db } from '@/lib/db'
import { formatDuration } from '@/lib/utils/format-duration'
import { formatPrice } from '@/lib/utils/format-price'
import { PaymentStatus } from '@/generated/prisma/enums'

// Date du creneau formatee en UTC : TimeSlot.date est un @db.Date (minuit UTC),
// formater en fuseau local decalerait le jour. UTC garantit le bon jour partout.
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'UTC' })

// Format full date + time pour le moment ou le paiement a ete fait (paidAt = DateTime).
const paidAtFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
})

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

/**
 * Envoie le recu de paiement au client apres qu'un Payment est passe SUCCEEDED.
 * Declenche depuis `markBookingPaid` (webhook Stripe + fallback /return).
 *
 * Defensive : si pour une raison X la fonction est appelee alors que le Payment
 * n'est pas SUCCEEDED, ou si le booking n'existe plus, on no-op silencieusement.
 * Best-effort sur l'envoi : un echec SMTP/Resend ne doit pas casser le marquage.
 */
export async function sendPaymentReceiptEmail(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      client: { select: { name: true, email: true } },
      service: { select: { name: true, duration: true } },
      timeSlot: { select: { date: true, startTime: true, endTime: true } },
      member: {
        select: {
          user: { select: { name: true } },
          organization: { select: { name: true, address: true } },
        },
      },
      payment: {
        select: {
          status: true,
          amount: true,
          paidAt: true,
          stripePaymentIntentId: true,
          receiptUrl: true,
        },
      },
    },
  })

  // No-op si on n'a pas un paiement reussi a notifier.
  if (!booking || !booking.payment || booking.payment.status !== PaymentStatus.SUCCEEDED) {
    return
  }

  const { client, service, timeSlot, member, payment } = booking
  const org = member.organization

  const dateLabel = dateFormatter.format(timeSlot.date)
  const timeLabel = `${timeSlot.startTime} - ${timeSlot.endTime}`
  const durationLabel = formatDuration(service.duration)
  const amountLabel = formatPrice(payment.amount)
  const paidAtLabel = payment.paidAt ? paidAtFormatter.format(payment.paidAt) : '-'
  // Pour la reference Stripe, on prefere l'id PaymentIntent (`pi_...`) car c'est
  // ce qui apparait sur la facture Stripe et dans le dashboard. Fallback "-"
  // dans le cas extreme ou le webhook a marque paye sans PI (ne devrait pas arriver).
  const paymentReference = payment.stripePaymentIntentId ?? '-'

  const manageUrl = `${getServerAppUrl()}/client/bookings`

  try {
    await sendEmail({
      to: client.email,
      subject: `Votre paiement chez ${org.name} est confirme`,
      react: PaymentReceiptTemplate({
        clientName: client.name,
        orgName: org.name,
        orgAddress: org.address,
        memberName: member.user.name,
        serviceName: service.name,
        durationLabel,
        dateLabel,
        timeLabel,
        amountLabel,
        paidAtLabel,
        paymentReference,
        receiptUrl: payment.receiptUrl,
        manageUrl,
      }),
      tags: [{ name: 'type', value: 'payment-receipt-client' }],
    })
  } catch (error) {
    console.error('[payment] envoi email recu echoue:', error)
  }
}
