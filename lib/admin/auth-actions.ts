'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_USER = process.env.ADMIN_BASIC_USER ?? ''
const ADMIN_PASS = process.env.ADMIN_BASIC_PASS ?? ''
const ADMIN_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? ''

export async function adminLogin(_: unknown, formData: FormData) {
  const user = formData.get('user')?.toString() ?? ''
  const pass = formData.get('pass')?.toString() ?? ''

  if (!user || !pass || !ADMIN_USER || !ADMIN_PASS || !ADMIN_TOKEN) {
    return { error: 'Identifiants invalides.' }
  }

  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    return { error: 'Identifiants invalides.' }
  }

  const jar = await cookies()
  jar.set('cutbook_admin_session', ADMIN_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  redirect('/admin')
}

export async function adminLogout() {
  const jar = await cookies()
  jar.delete('cutbook_admin_session')
  redirect('/admin-login')
}
