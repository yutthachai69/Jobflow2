import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 1. Config CSP
const isDev = process.env.NODE_ENV !== 'production'

// รวม CSP เป็นชุดเดียวที่รองรับ Next.js ทั้ง Dev และ Prod
// เพิ่ม 'unsafe-inline' 'unsafe-eval' เพื่อแก้ปัญหา Script blocked
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", 
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' ws: wss: http://localhost:* https://localhost:* http://18.142.112.163:*", // เพิ่ม IP Server เผื่อไว้
  "frame-ancestors 'none'",
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

  // 3. ยัด CSP Header
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
}