import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const qrCode = sanitizeString(searchParams.get('qrCode'))

    if (!qrCode) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const asset = await prisma.asset.findUnique({
      where: { qrCode },
      select: {
        id: true,
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ assetId: asset.id })
  } catch (error) {
    const errorResponse = handleApiError(error, request)
    logger.error('Asset find failed', { ip: getClientIP(request) }, error as Error)
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    )
  }
}

