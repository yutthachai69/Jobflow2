import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 1. นำโค้ด CSP มาวางตรงนี้ (ปรับให้เป็น String บรรทัดเดียว)
// ใน development mode ใช้ CSP ที่ผ่อนปรนกว่าเพื่อให้ debug ง่าย
const isDev = process.env.NODE_ENV !== 'production'
const csp = isDev
  ? [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self' ws: wss: http://localhost:* https://localhost:*",
      "frame-ancestors 'none'",
    ].join('; ')
  : [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')

const LOGIN_URL = '/login'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware สำหรับ static files (images, fonts, etc.)
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)) {
    return NextResponse.next()
  }
  
  const token = request.cookies.get('auth_token')?.value
  const hasSession = !!token

  const isApiRoute = pathname.startsWith('/api')
  const isPublicRoute = ['/login', '/welcome', '/register'].includes(pathname)
  // /scan และ /scan/[qrCode] เป็น protected route แต่ถ้ายังไม่ login จะ redirect ไป login พร้อม callbackUrl
  const isScanRoute = pathname.startsWith('/scan')
  const isProtectedRoute = !isPublicRoute && !pathname.startsWith('/_next')

  // --- ส่วน Logic การ Login (เหมือนเดิม) ---
  if (!hasSession) {
    if (isApiRoute) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    // ถ้าเข้า root path ให้ไป welcome
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/welcome', request.url))
    }
    // ถ้าเป็น scan route ให้ redirect ไป login พร้อม callbackUrl
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

  // 2. สร้าง Response Object ขึ้นมาก่อน
  const response = NextResponse.next()

  // 3. ยัด CSP Header เข้าไปใน Response
  response.headers.set('Content-Security-Policy', csp)

  // 4. ส่ง Response กลับไป
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - *.png, *.jpg, *.jpeg, *.gif, *.svg, *.webp (image files)
     * - *.ico, *.woff, *.woff2, *.ttf, *.eot (font files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
}