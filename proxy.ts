import { type NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  const isAuthRoute = pathname === '/login' || pathname === '/cadastro'
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/goals') ||
    pathname.startsWith('/reports')

  const user = token ? await verifyToken(token) : null

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && user) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
