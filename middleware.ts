import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const IDLE_TIMEOUT_MINUTES = 30 // Idle timeout 30 นาที
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000

/**
 * Security middleware for adding security headers and session management
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const userId = request.cookies.get('user_id')?.value
  const lastActivity = request.cookies.get('session_last_activity')?.value

  // Session Management: เช็ค idle timeout
  if (userId && lastActivity) {
    const lastActivityTime = parseInt(lastActivity, 10)
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityTime

    if (timeSinceLastActivity > IDLE_TIMEOUT_MS) {
      // Session หมดอายุเนื่องจาก idle timeout - clear cookies
      response.cookies.delete('user_id')
      response.cookies.delete('session_last_activity')
    } else {
      // Session ยัง active - อัพเดท lastActivity
      response.cookies.set('session_last_activity', now.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }
  } else if (userId && !lastActivity) {
    // มี user_id แต่ไม่มี lastActivity - set lastActivity (สำหรับ session เก่า)
    response.cookies.set('session_last_activity', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  }

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy (CSP)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


