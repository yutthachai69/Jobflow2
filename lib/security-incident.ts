/**
 * Security Incident Tracking Utilities
 * 
 * Functions for recording and managing security incidents
 */

import { prisma } from './prisma'
import { logger } from './logger'
import { IncidentType, IncidentSeverity } from '@prisma/client'

interface CreateIncidentOptions {
  type: IncidentType
  severity?: IncidentSeverity
  description: string
  metadata?: Record<string, any>
  userId?: string
  username?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Create a security incident record
 */
export async function createSecurityIncident(options: CreateIncidentOptions) {
  try {
    const incident = await prisma.securityIncident.create({
      data: {
        type: options.type,
        severity: options.severity || IncidentSeverity.MEDIUM,
        description: options.description,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        userId: options.userId || null,
        username: options.username || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    })

    // Log to console/logger
    logger.security(`Security Incident: ${options.type}`, {
      incidentId: incident.id,
      severity: incident.severity,
      description: incident.description,
      userId: incident.userId,
      username: incident.username,
      ipAddress: incident.ipAddress,
    })

    return incident
  } catch (error) {
    // Don't throw - we don't want security logging to break the app
    logger.error('Failed to create security incident', {
      error: error instanceof Error ? error.message : String(error),
      type: options.type,
    })
    return null
  }
}

/**
 * Get security incidents with filters
 */
export async function getSecurityIncidents(options: {
  type?: IncidentType
  severity?: IncidentSeverity
  resolved?: boolean
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {}

  if (options.type) {
    where.type = options.type
  }

  if (options.severity) {
    where.severity = options.severity
  }

  if (options.resolved !== undefined) {
    where.resolved = options.resolved
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) {
      where.createdAt.gte = options.startDate
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate
    }
  }

  const [incidents, total] = await Promise.all([
    prisma.securityIncident.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.securityIncident.count({ where }),
  ])

  return {
    incidents: incidents.map(incident => ({
      ...incident,
      metadata: incident.metadata ? JSON.parse(incident.metadata) : null,
    })),
    total,
  }
}

/**
 * Resolve a security incident
 */
export async function resolveSecurityIncident(incidentId: string, resolvedBy: string) {
  return await prisma.securityIncident.update({
    where: { id: incidentId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
    },
  })
}

/**
 * Get incident statistics
 */
export async function getIncidentStatistics() {
  const [total, unresolved, byType, bySeverity] = await Promise.all([
    prisma.securityIncident.count(),
    prisma.securityIncident.count({ where: { resolved: false } }),
    prisma.securityIncident.groupBy({
      by: ['type'],
      _count: true,
    }),
    prisma.securityIncident.groupBy({
      by: ['severity'],
      _count: true,
    }),
  ])

  return {
    total,
    unresolved,
    byType: byType.map(item => ({
      type: item.type,
      count: item._count,
    })),
    bySeverity: bySeverity.map(item => ({
      severity: item.severity,
      count: item._count,
    })),
  }
}

