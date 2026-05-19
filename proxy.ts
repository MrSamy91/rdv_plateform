import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Routes protégées par session BetterAuth ────────────────────────────────────
const protectedRoutes = ['/client', '/member']
const authRoutes = ['/login', '/register']

// ── Token admin (même valeur que ADMIN_SESSION_TOKEN dans .env) ────────────────
const ADMIN_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? ''

function isRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value,
  )
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Guard admin : cookie de session ───────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // /admin-login est accessible sans cookie (c'est la porte d'entrée)
    if (pathname.startsWith('/admin-login')) return NextResponse.next()

    // Fail-closed : si le token n'est pas configuré → personne ne passe
    if (!ADMIN_TOKEN) return NextResponse.redirect(new URL('/admin-login', request.url))

    const cookie = request.cookies.get('cutbook_admin_session')?.value
    if (!cookie || cookie !== ADMIN_TOKEN) {
      return NextResponse.redirect(new URL('/admin-login', request.url))
    }

    // ✅ Cookie valide — le layout vérifie aussi l'email (2ème couche)
    return NextResponse.next()
  }

  // ── Guard session sur /client et /member ───────────────────────────────────
  const isAuthenticated = hasSessionCookie(request)

  if (isRoute(pathname, protectedRoutes) && !isAuthenticated) {
    return redirectToLogin(request)
  }

  if (isRoute(pathname, authRoutes) && isAuthenticated) {
    return NextResponse.redirect(new URL('/client', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/client/:path*', '/member/:path*', '/login', '/register'],
}
