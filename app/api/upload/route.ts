import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, createLogContext } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { getClientIP as getSecurityIP } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    // Authorization check
    const user = await getCurrentUser()
    if (!user || (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting for file uploads
    const ip = getSecurityIP(request)
    const rateLimitResult = checkRateLimit(ip, 'UPLOAD')
    
    if (!rateLimitResult.allowed) {
      logger.warn('File upload rate limit exceeded', {
        userId: user.id,
        username: user.username,
        ip,
      })
      
      return NextResponse.json(
        { 
          error: 'Too many upload requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt?.toISOString() || '',
          },
        }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const photoType = formData.get('photoType') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `job-photos/${photoType}/${timestamp}-${randomStr}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    // Get user again in case it wasn't set in try block
    const user = await getCurrentUser().catch(() => null)
    const context = await createLogContext(request, user)
    const errorResponse = await handleApiError(error, request, user)
    
    logger.error('File upload failed', context, error as Error)
    
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    )
  }
}

