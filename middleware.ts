import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// 1. Config CSP
const isDev = process.env.NODE_ENV !== 'production'

// CSP Policy - ปรับปรุงเพื่อความปลอดภัยมากขึ้น
// ใน production: ลด unsafe-inline/unsafe-eval
// ใน development: อนุญาตเพื่อความสะดวกในการพัฒนา
const csp = isDev
  ? [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.line-scdn.net https://d.line-scdn.net https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.line-scdn.net https://profile.line-scdn.net https://*.supabase.co https://*.public.blob.vercel-storage.com https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://*.google.com https://*.googleusercontent.com",
    "connect-src 'self' ws: wss: http://localhost:* https://localhost:* https://api.line.me https://*.line-scdn.net https://*.supabase.co https://*.public.blob.vercel-storage.com https://maps.googleapis.com https://*.google.com",
    "frame-ancestors 'none'",
  ].join('; ')
  : [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://static.line-scdn.net https://d.line-scdn.net https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.line-scdn.net https://profile.line-scdn.net https://*.supabase.co https://*.public.blob.vercel-storage.com https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://*.google.com https://*.googleusercontent.com",
    "connect-src 'self' https://api.line.me https://*.line-scdn.net https://*.supabase.co https://*.public.blob.vercel-storage.com https://maps.googleapis.com https://*.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

const LOGIN_URL = '/login'

// Get JWT secret from environment
function getSecretKey() {
  const secret = process.env.JWT_SECRET || 'my-super-secret-key-change-it-now'
  return new TextEncoder().encode(secret)
}

// Verify token and check expiration
// Returns payload if valid, null if invalid/expired
async function verifyToken(token: string): Promise<boolean> {
  try {
    const secretKey = getSecretKey()
    const { payload } = await jwtVerify(token, secretKey)

    // Check inactivity timeout (30 minutes)
    const INACTIVITY_TIMEOUT = 30 * 60 // 30 minutes in seconds
    const lastActivity = (payload.lastActivity as number) || payload.iat!
    const now = Math.floor(Date.now() / 1000) // Current time in seconds

    if (now - lastActivity > INACTIVITY_TIMEOUT) {
      // Session expired due to inactivity
      return false
    }

    return true
  } catch (error) {
    // Token invalid or expired
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware สำหรับ static files
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|mp4|webm|ogg)$/)) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth_token')?.value
  let hasValidSession = false

  // Verify token if exists
  if (token) {
    hasValidSession = await verifyToken(token)
  }

  const isApiRoute = pathname.startsWith('/api')
  const isPublicRoute = ['/login', '/welcome', '/register'].includes(pathname)
  const isScanRoute = pathname.startsWith('/scan')
  const isProtectedRoute = !isPublicRoute && !pathname.startsWith('/_next')

  // --- ส่วน Logic การ Login ---
  if (!hasValidSession) {
    // ถ้า token หมดอายุหรือไม่ valid ให้ลบ cookie
    const response = isApiRoute
      ? NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      : pathname === '/'
        ? NextResponse.redirect(new URL('/welcome', request.url))
        : isScanRoute
          ? (() => {
            const url = new URL(LOGIN_URL, request.url)
            url.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(url)
          })()
          : isProtectedRoute
            ? (() => {
              const url = new URL(LOGIN_URL, request.url)
              url.searchParams.set('callbackUrl', pathname)
              return NextResponse.redirect(url)
            })()
            : NextResponse.next()

    // ลบ cookie ถ้า token หมดอายุ
    if (token) {
      response.cookies.delete('auth_token')
    }

    return response
  }

  if (hasValidSession && pathname === LOGIN_URL) {
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|mp4|webm|ogg)).*)',
  ],
}