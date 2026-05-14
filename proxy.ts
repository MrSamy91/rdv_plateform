import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/client', '/member']
const authRoutes = ['/login', '/register']

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
  matcher: ['/client/:path*', '/member/:path*', '/login', '/register'],
}
