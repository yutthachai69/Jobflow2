import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError } from '@/lib/error-handler'
import { createLogContext } from '@/lib/logger'
import { logger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIP as getSecurityIP } from '@/lib/security'
import { createClient } from '@supabase/supabase-js'

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

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = fileExtension || 'jpg'
    const filePath = `${photoType}/${timestamp}-${randomStr}.${extension}`

    // Upload via Supabase Storage (production)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(filePath)

      return NextResponse.json({ url: publicUrl })
    } else {
      // Fallback: Local File Storage (for development without Supabase env vars)
      try {
        const { writeFile, mkdir } = await import('fs/promises')
        const { join } = await import('path')

        const publicDir = join(process.cwd(), 'public')
        const relativePath = `job-photos/${photoType}/${timestamp}-${randomStr}.${extension}`
        const finalFilePath = join(publicDir, relativePath)
        const dir = join(publicDir, 'job-photos', photoType)

        await mkdir(dir, { recursive: true })
        const buffer = Buffer.from(arrayBuffer)
        await writeFile(finalFilePath, buffer)

        return NextResponse.json({ url: `/${relativePath}` })
      } catch (localError: any) {
        console.error('Local file upload failed:', localError)
        return NextResponse.json({
          error: 'Local upload failed: ' + localError.message
        }, { status: 500 })
      }
    }
  } catch (error) {
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
