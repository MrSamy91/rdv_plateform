import type { ReactNode } from 'react'
import { render } from '@react-email/render'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { env } from '@/lib/env'

let resend: Resend | null = null
let smtpTransport: nodemailer.Transporter | null = null

type EmailProvider = 'resend' | 'smtp'

function getResendClient() {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required to send emails')
  }

  resend ??= new Resend(env.RESEND_API_KEY)

  return resend
}

function getEmailFrom() {
  if (!env.EMAIL_FROM) {
    throw new Error('EMAIL_FROM is required to send emails')
  }

  return env.EMAIL_FROM
}

function getEmailProvider(): EmailProvider {
  return env.EMAIL_PROVIDER ?? (env.NODE_ENV === 'production' ? 'resend' : 'smtp')
}

function getSmtpTransport() {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: env.SMTP_HOST ?? 'localhost',
      port: env.SMTP_PORT ?? 1025,
      secure: env.SMTP_SECURE === 'true',
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
    })
  }

  return smtpTransport
}

interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: ReactNode
  text?: string
  tags?: Array<{
    name: string
    value: string
  }>
}

export async function sendEmail({ to, subject, react, text, tags }: SendEmailOptions) {
  const provider = getEmailProvider()
  const from = getEmailFrom()

  if (provider === 'smtp') {
    const html = await render(react)
    const fallbackText = text ?? (await render(react, { plainText: true }))

    return await getSmtpTransport().sendMail({
      from,
      to,
      subject,
      html,
      text: fallbackText,
    })
  }

  return await getResendClient().emails.send({
    from,
    to,
    subject,
    react,
    text,
    tags,
  })
}

export { VerifyEmailTemplate } from './templates/verify-email-template'
