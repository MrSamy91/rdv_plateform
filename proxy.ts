import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Proxy = garde UX optimiste uniquement. Les vraies autorisations (rôles) restent
// cote serveur : requireAdmin() / requireSession() dans les layouts protégés.
// Ici on ne décide QUE "a un cookie de session -> laisse passer, sinon -> /login".
const protectedRoutes = ['/admin', '/client', '/member', '/owner']
const authRoutes = ['/login', '/register']

function isRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

// callbackUrl vient du client -> jamais de confiance.
// On exige un chemin interne : un seul '/' en tête, jamais '//' ni '/\'.
// Sinon `new URL('//evil.com', origin)` résout vers un domaine externe = open redirect.
function safeInternalPath(path: string | null, fallback: string) {
  return path && /^\/(?![/\\])/.test(path) ? path : fallback
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // getSessionCookie gère le cookiePrefix + le prefix __Secure- tout seul (pas de noms
  // hardcodés à maintenir). Vérifie la présence du cookie, pas sa validité -> suffisant
  // pour un redirect optimiste, l'authz réelle se fait côté serveur.
  const isAuthenticated = Boolean(getSessionCookie(request))

  if (isRoute(pathname, protectedRoutes) && !isAuthenticated) {
    return redirectToLogin(request)
  }

  if (isRoute(pathname, authRoutes) && isAuthenticated) {
    const callbackUrl = safeInternalPath(request.nextUrl.searchParams.get('callbackUrl'), '/client')
    return NextResponse.redirect(new URL(callbackUrl, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/client',
    '/client/:path*',
    '/member',
    '/member/:path*',
    '/owner',
    '/owner/:path*',
    '/login',
    '/register',
  ],
}
