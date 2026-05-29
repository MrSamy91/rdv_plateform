import { Button, Link, Section, Text } from '@react-email/components'
import { EmailShell, emailStyles, RecapCard, RecapRow } from './email-shell'

// Encadre vert clair qui detaille le paiement Stripe (montant + date + reference).
// Mutualise visuellement avec le bloc paiement du template de confirmation booking
// pour rester coherent quand le client reçoit les 2 mails (confirmation + recu).
const receiptBox = {
  margin: '0 0 20px',
  padding: '16px 18px',
  backgroundColor: '#f0f7f2',
  border: `1px solid ${emailStyles.colors.green500}`,
  borderRadius: '10px',
}

const receiptTitle = {
  margin: '0 0 6px',
  color: emailStyles.colors.green600,
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}

const receiptLine = {
  margin: '0',
  color: emailStyles.colors.slate700,
  fontSize: '14px',
  lineHeight: '1.6',
}

interface PaymentReceiptTemplateProps {
  clientName?: string | null
  orgName: string
  orgAddress: string
  memberName: string
  serviceName: string
  durationLabel: string
  dateLabel: string
  timeLabel: string
  amountLabel: string
  paidAtLabel: string
  paymentReference: string
  // Lien vers le reçu Stripe officiel (charge.receipt_url). Optionnel : si
  // recupere depuis l'API echoue, on envoie quand meme l'email sans bouton.
  receiptUrl?: string | null
  manageUrl: string
}

export function PaymentReceiptTemplate({
  clientName,
  orgName,
  orgAddress,
  memberName,
  serviceName,
  durationLabel,
  dateLabel,
  timeLabel,
  amountLabel,
  paidAtLabel,
  paymentReference,
  receiptUrl,
  manageUrl,
}: PaymentReceiptTemplateProps) {
  const greeting = clientName ? `Bonjour ${clientName},` : 'Bonjour,'

  return (
    <EmailShell
      preview={`Votre paiement chez ${orgName} est confirme`}
      eyebrow="Paiement recu"
      title="Merci, votre paiement est confirme"
    >
      <Text style={emailStyles.text}>{greeting}</Text>
      <Text style={emailStyles.text}>
        Nous avons bien reçu votre paiement pour votre rendez-vous chez {orgName}. Voici le
        recapitulatif :
      </Text>

      <RecapCard>
        <RecapRow label="Date" value={dateLabel} />
        <RecapRow label="Horaire" value={timeLabel} />
        <RecapRow label="Prestation" value={serviceName} />
        <RecapRow label="Duree" value={durationLabel} />
        <RecapRow label="Avec" value={memberName} />
        <RecapRow label="Lieu" value={orgName} />
        <RecapRow label="Adresse" value={orgAddress} isLast />
      </RecapCard>

      <Section style={receiptBox}>
        <Text style={receiptTitle}>Detail du paiement</Text>
        <Text style={receiptLine}>Montant : {amountLabel}</Text>
        <Text style={receiptLine}>Date : {paidAtLabel}</Text>
        <Text style={receiptLine}>Reference Stripe : {paymentReference}</Text>
      </Section>

      {receiptUrl ? (
        <Button href={receiptUrl} style={emailStyles.button}>
          Voir ma facture Stripe
        </Button>
      ) : null}

      <Text style={emailStyles.mutedText}>
        Vous pouvez aussi gerer votre rendez-vous depuis votre espace :{' '}
        <Link href={manageUrl} style={emailStyles.link}>
          {manageUrl}
        </Link>
      </Text>
    </EmailShell>
  )
}
