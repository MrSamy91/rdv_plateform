import { Button, Link, Section, Text } from '@react-email/components'
import { EmailShell, emailStyles, RecapCard, RecapRow } from './email-shell'

// Detail de paiement en ligne. Optionnel : tant que Stripe n'est pas branche,
// le sender ne fournit pas cette prop -> le bloc reste masque (cf. plan feature).
interface BookingPaymentDetail {
  amountLabel: string
  method?: string
  reference?: string
  dateLabel?: string
}

interface BookingConfirmationClientTemplateProps {
  clientName?: string | null
  orgName: string
  orgAddress: string
  orgPhone: string
  memberName: string
  serviceName: string
  durationLabel: string
  dateLabel: string
  timeLabel: string
  priceLabel: string
  manageUrl: string
  payment?: BookingPaymentDetail
}

// Encadre vert clair qui confirme le paiement en ligne (affiche uniquement si paye).
const paymentBox = {
  margin: '0 0 20px',
  padding: '16px 18px',
  backgroundColor: '#f0f7f2',
  border: `1px solid ${emailStyles.colors.green500}`,
  borderRadius: '10px',
}

const paymentTitle = {
  margin: '0 0 6px',
  color: emailStyles.colors.green600,
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}

const paymentLine = {
  margin: '0',
  color: emailStyles.colors.slate700,
  fontSize: '14px',
  lineHeight: '1.6',
}

export function BookingConfirmationClientTemplate({
  clientName,
  orgName,
  orgAddress,
  orgPhone,
  memberName,
  serviceName,
  durationLabel,
  dateLabel,
  timeLabel,
  priceLabel,
  manageUrl,
  payment,
}: BookingConfirmationClientTemplateProps) {
  const greeting = clientName ? `Bonjour ${clientName},` : 'Bonjour,'

  return (
    <EmailShell
      preview={`Votre rendez-vous chez ${orgName} est confirme`}
      eyebrow="Reservation confirmee"
      title="Votre rendez-vous est confirme"
    >
      <Text style={emailStyles.text}>{greeting}</Text>
      <Text style={emailStyles.text}>
        Votre reservation chez {orgName} est confirmee. Voici le recapitulatif de votre rendez-vous
        :
      </Text>

      <RecapCard>
        <RecapRow label="Date" value={dateLabel} />
        <RecapRow label="Horaire" value={timeLabel} />
        <RecapRow label="Prestation" value={serviceName} />
        <RecapRow label="Duree" value={durationLabel} />
        <RecapRow label="Avec" value={memberName} />
        <RecapRow label="Lieu" value={orgName} />
        <RecapRow label="Adresse" value={orgAddress} />
        <RecapRow label="Telephone" value={orgPhone} />
        <RecapRow label="Montant" value={priceLabel} isLast />
      </RecapCard>

      {payment ? (
        <Section style={paymentBox}>
          <Text style={paymentTitle}>Paiement regle en ligne</Text>
          <Text style={paymentLine}>Montant paye : {payment.amountLabel}</Text>
          {payment.method ? <Text style={paymentLine}>Moyen : {payment.method}</Text> : null}
          {payment.dateLabel ? <Text style={paymentLine}>Le {payment.dateLabel}</Text> : null}
          {payment.reference ? (
            <Text style={paymentLine}>Reference : {payment.reference}</Text>
          ) : null}
        </Section>
      ) : (
        <Text style={emailStyles.mutedText}>
          Montant a regler sur place le jour du rendez-vous.
        </Text>
      )}

      <Button href={manageUrl} style={emailStyles.button}>
        Gerer ma reservation
      </Button>

      <Text style={emailStyles.mutedText}>
        Besoin de modifier ou d&apos;annuler ? Gerez votre rendez-vous depuis votre espace :{' '}
        <Link href={manageUrl} style={emailStyles.link}>
          {manageUrl}
        </Link>
      </Text>
    </EmailShell>
  )
}
