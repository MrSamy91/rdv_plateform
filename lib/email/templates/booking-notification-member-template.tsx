import { Button, Link, Text } from '@react-email/components'
import { EmailShell, emailStyles, RecapCard, RecapRow } from './email-shell'

interface BookingNotificationMemberTemplateProps {
  memberName?: string | null
  orgName: string
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  serviceName: string
  durationLabel: string
  dateLabel: string
  timeLabel: string
  priceLabel: string
  manageUrl: string
}

export function BookingNotificationMemberTemplate({
  memberName,
  orgName,
  clientName,
  clientEmail,
  clientPhone,
  serviceName,
  durationLabel,
  dateLabel,
  timeLabel,
  priceLabel,
  manageUrl,
}: BookingNotificationMemberTemplateProps) {
  const greeting = memberName ? `Bonjour ${memberName},` : 'Bonjour,'

  return (
    <EmailShell
      preview={`Nouveau rendez-vous : ${serviceName} le ${dateLabel}`}
      eyebrow="Nouveau rendez-vous"
      title="Un nouveau RDV dans votre planning"
    >
      <Text style={emailStyles.text}>{greeting}</Text>
      <Text style={emailStyles.text}>
        Un client vient de reserver un creneau chez {orgName}. Voici le detail :
      </Text>

      <RecapCard>
        <RecapRow label="Client" value={clientName} />
        <RecapRow label="Email" value={clientEmail} />
        {clientPhone ? <RecapRow label="Telephone" value={clientPhone} /> : null}
        <RecapRow label="Prestation" value={serviceName} />
        <RecapRow label="Duree" value={durationLabel} />
        <RecapRow label="Date" value={dateLabel} />
        <RecapRow label="Horaire" value={timeLabel} />
        <RecapRow label="Montant" value={priceLabel} isLast />
      </RecapCard>

      <Button href={manageUrl} style={emailStyles.button}>
        Voir mon planning
      </Button>

      <Text style={emailStyles.mutedText}>
        Retrouvez tous vos rendez-vous dans votre espace :{' '}
        <Link href={manageUrl} style={emailStyles.link}>
          {manageUrl}
        </Link>
      </Text>
    </EmailShell>
  )
}
