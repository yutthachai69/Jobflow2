import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { sanitizeString } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIP } from '@/lib/security'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const rateLimitResult = checkRateLimit(ip, 'API')
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const text = sanitizeString(searchParams.get('text'))

    if (!text) {
      return new NextResponse('Invalid request', { status: 400 })
    }

    // Limit text length to prevent DoS
    if (text.length > 1000) {
      return new NextResponse('Text too long', { status: 400 })
    }

    // Generate QR Code as Data URL (base64)
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Convert Data URL to Buffer
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Return as PNG image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    const errorResponse = handleApiError(error, request, null)
    logger.error('QR code generation failed', { ip: getClientIP(request) }, error as Error)
    return new NextResponse(errorResponse.error, { status: errorResponse.statusCode })
  }
}

