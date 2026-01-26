import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 1. Config CSP
const isDev = process.env.NODE_ENV !== 'production'

// CSP Policy - ปรับปรุงเพื่อความปลอดภัยมากขึ้น
// ใน production: ลด unsafe-inline/unsafe-eval
// ใน development: อนุญาตเพื่อความสะดวกในการพัฒนา
const csp = isDev
  ? [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // อนุญาตใน dev เท่านั้น
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self' ws: wss: http://localhost:* https://localhost:*",
      "frame-ancestors 'none'",
    ].join('; ')
  : [
      "default-src 'self'",
      "script-src 'self'", // ไม่มี unsafe-inline/unsafe-eval ใน production
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // จำเป็นสำหรับ Next.js
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')

const LOGIN_URL = '/login'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware สำหรับ static files
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)) {
    return NextResponse.next()
  }
  
  const token = request.cookies.get('auth_token')?.value
  const hasSession = !!token

  const isApiRoute = pathname.startsWith('/api')
  const isPublicRoute = ['/login', '/welcome', '/register'].includes(pathname)
  const isScanRoute = pathname.startsWith('/scan')
  const isProtectedRoute = !isPublicRoute && !pathname.startsWith('/_next')

  // --- ส่วน Logic การ Login ---
  if (!hasSession) {
    if (isApiRoute) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/welcome', request.url))
    }
    if (isScanRoute) {
      const url = new URL(LOGIN_URL, request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    if (isProtectedRoute) {
      const url = new URL(LOGIN_URL, request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  if (hasSession && pathname === LOGIN_URL) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  // ------------------------------------

  // 2. สร้าง Response
  const response = NextResponse.next()

  // 3. Security Headers
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // HSTS - ใช้เฉพาะใน production และ HTTPS
  if (!isDev && request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
}