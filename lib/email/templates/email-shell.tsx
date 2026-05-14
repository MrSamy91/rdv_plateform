import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

interface EmailShellProps {
  preview: string
  eyebrow?: string
  title: string
  children: ReactNode
}

const colors = {
  slate50: '#f8f9f7',
  slate100: '#eff1ed',
  slate200: '#dfe3da',
  slate500: '#7a927e',
  slate600: '#5a7363',
  slate700: '#3f5248',
  slate800: '#253122',
  green500: '#489b6e',
  green600: '#3b8259',
  gold50: '#fbf9f3',
  gold500: '#c5a56e',
  gold600: '#b39456',
}

export const emailStyles = {
  colors,
  body: {
    margin: '0',
    backgroundColor: colors.slate50,
    color: colors.slate800,
    fontFamily: 'Sora, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: '560px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: `1px solid ${colors.slate200}`,
    borderRadius: '12px',
    overflow: 'hidden',
  },
  header: {
    padding: '28px 32px 20px',
    backgroundColor: colors.gold50,
    borderBottom: `1px solid ${colors.slate200}`,
  },
  brand: {
    margin: '0 0 18px',
    color: colors.green600,
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  eyebrow: {
    margin: '0 0 8px',
    color: colors.gold600,
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  heading: {
    margin: '0',
    color: colors.slate800,
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '1.25',
  },
  content: {
    padding: '28px 32px 32px',
  },
  text: {
    margin: '0 0 16px',
    color: colors.slate700,
    fontSize: '15px',
    lineHeight: '1.6',
  },
  mutedText: {
    margin: '16px 0 0',
    color: colors.slate500,
    fontSize: '13px',
    lineHeight: '1.5',
  },
  hr: {
    borderColor: colors.slate200,
    margin: '24px 0',
  },
  footer: {
    margin: '20px 0 0',
    color: colors.slate500,
    fontSize: '12px',
    lineHeight: '1.5',
    textAlign: 'center' as const,
  },
}

export function EmailShell({ preview, eyebrow, title, children }: EmailShellProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.card}>
            <Section style={emailStyles.header}>
              <Text style={emailStyles.brand}>CutBook</Text>
              {eyebrow ? <Text style={emailStyles.eyebrow}>{eyebrow}</Text> : null}
              <Heading as="h1" style={emailStyles.heading}>
                {title}
              </Heading>
            </Section>

            <Section style={emailStyles.content}>{children}</Section>
          </Section>

          <Hr style={emailStyles.hr} />
          <Text style={emailStyles.footer}>
            CutBook - reservation en ligne, paiement et fidelite pour les professionnels.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
