import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError } from '@/lib/error-handler'
import { createLogContext } from '@/lib/logger'
import { logger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit'
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
      // ปิด warning log (ข้อมูลยังถูกบันทึกใน database อยู่)
      // logger.warn('File upload rate limit exceeded', {
      //   userId: user.id,
      //   username: user.username,
      //   ip,
      // })

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

    // Validate file type by MIME type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Validate file size (min 1 byte)
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // Validate file extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({
        error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`
      }, { status: 400 })
    }

    // Validate filename (prevent path traversal)
    // Safe replace: Keep only alphanumeric, dot, underscore, and dash. Replace others with underscore.
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Instead of rejecting, we use the sanitized name if it's different (or just generate a new one anyway below)
    // The previous check was too strict for Thai characters or spaces
    // if (sanitizedFilename !== file.name) {
    //   return NextResponse.json({ error: 'Invalid filename characters' }, { status: 400 })
    // }

    // Read file header to validate file signature (magic bytes)
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer.slice(0, 12))

    // Check file signatures (magic bytes)
    const isValidImage =
      // JPEG: FF D8 FF
      (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) ||
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) ||
      // GIF: 47 49 46 38 (GIF8)
      (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x38) ||
      // WebP: RIFF...WEBP
      (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
        uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50)

    if (!isValidImage) {
      return NextResponse.json({
        error: 'Invalid file format. File signature does not match image type.'
      }, { status: 400 })
    }

    // Generate unique filename (sanitized)
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = fileExtension || 'jpg'
    // Generate relative path: job-photos/BEFORE/123456-abcde.jpg
    const relativePath = `job-photos/${photoType}/${timestamp}-${randomStr}.${extension}`

    // Check if Vercel Blob token exists
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Upload to Vercel Blob
      const blob = await put(relativePath, file, {
        access: 'public',
        contentType: file.type,
      })
      return NextResponse.json({ url: blob.url })
    } else {
      // Fallback: Local File Storage (for development)
      try {
        const { writeFile, mkdir } = await import('fs/promises')
        const { join } = await import('path')

        // Define local storage path in 'public' directory
        const publicDir = join(process.cwd(), 'public')
        const finalFilePath = join(publicDir, relativePath)
        const dir = join(publicDir, 'job-photos', photoType)

        // Ensure directory exists
        await mkdir(dir, { recursive: true })

        // Write file
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(finalFilePath, buffer)

        // Return local URL
        return NextResponse.json({ url: `/${relativePath}` })
      } catch (localError: any) {
        console.error('Local file upload failed:', localError)
        return NextResponse.json({
          error: 'Local upload failed: ' + localError.message
        }, { status: 500 })
      }
    }
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

