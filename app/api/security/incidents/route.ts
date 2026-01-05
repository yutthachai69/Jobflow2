import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSecurityIncidents, getIncidentStatistics } from '@/lib/security-incident'
import { handleApiError, createLogContext } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { IncidentType, IncidentSeverity } from '@prisma/client'

/**
 * GET /api/security/incidents
 * Get security incidents (ADMIN only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as IncidentType | null
    const severity = searchParams.get('severity') as IncidentSeverity | null
    const resolved = searchParams.get('resolved') === 'true' ? true : searchParams.get('resolved') === 'false' ? false : undefined
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const stats = searchParams.get('stats') === 'true'

    if (stats) {
      // Return statistics
      const statistics = await getIncidentStatistics()
      return NextResponse.json(statistics)
    }

    // Get incidents
    const result = await getSecurityIncidents({
      type: type || undefined,
      severity: severity || undefined,
      resolved,
      limit,
      offset,
      startDate,
      endDate,
    })

    return NextResponse.json(result)
  } catch (error) {
    const user = await getCurrentUser()
    const context = createLogContext(request, user)
    const errorResponse = handleApiError(error, request, user)
    
    logger.error('Failed to get security incidents', context, error as Error)
    
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    )
  }
}

