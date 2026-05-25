// Auth SERVER.
// A importer directement seulement si tu veux expliciter le runtime serveur.
// L'import public recommande reste `@/lib/auth`.
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Role } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { authConfig } from './_config'

export const auth = authConfig

const ADMIN_EMAILS = (env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

/**
 * Bootstrap admin : un email present dans ADMIN_EMAILS est admin meme sans
 * role ADMIN en BDD (utile pour promouvoir le premier compte).
 */
export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Recupere la session de l'utilisateur cote serveur.
 * Retourne `null` si pas connecte.
 *
 * Usage :
 *   const session = await getSession()
 *   if (!session) redirect('/login')
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  })
}

export async function getCurrentUser() {
  const session = await getSession()

  if (!session) {
    return null
  }

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  })
}

export async function requireSession(callbackUrl = '/client') {
  const session = await getSession()

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return session
}

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?callbackUrl=/admin')
  }

  if (user.role !== Role.ADMIN && !isAdminEmail(user.email)) {
    redirect('/')
  }

  return user
}

/**
 * Garde l'espace pro (/member) : exige une fiche Member rattachee a une orga.
 * "Etre member" est une RELATION (ligne Member), pas un role plateforme.
 *
 * Memoise avec cache() : le layout ET la page peuvent l'appeler dans le meme
 * rendu sans declencher deux requetes DB.
 */
export const requireMember = cache(async () => {
  const session = await getSession()

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/member')}`)
  }

  const member = await db.member.findUnique({
    where: { userId: session.user.id },
    select: { id: true, orgId: true },
  })

  if (!member) {
    redirect('/client')
  }

  return { session, member }
})

/**
 * Garde l'espace owner : exige d'etre proprietaire d'une orga.
 * "Etre owner" est une RELATION (Organization.ownerId), pas un role plateforme.
 */
export const requireOwner = cache(async () => {
  const session = await getSession()

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/owner')}`)
  }

  const organization = await db.organization.findUnique({
    where: { ownerId: session.user.id },
  })

  if (!organization) {
    redirect('/client')
  }

  return { session, organization }
})
