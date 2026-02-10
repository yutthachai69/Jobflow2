import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SecurityIncidentsClient from './SecurityIncidentsClient'
import { IncidentType, IncidentSeverity } from '@prisma/client'

interface Props {
  searchParams: Promise<{
    type?: string
    severity?: string
    resolved?: string
    page?: string
  }>
}

export default async function SecurityIncidentsPage({ searchParams }: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // เฉพาะ ADMIN เท่านั้นที่สามารถดูหน้านี้ได้
  if (user.role !== 'ADMIN') {
    redirect('/')
  }

  const params = await searchParams
  const currentPage = parseInt(params.page || '1', 10)
  const itemsPerPage = 50

  // Build where clause
  const where: any = {}
  if (params.type) {
    where.type = params.type as IncidentType
  }
  if (params.severity) {
    where.severity = params.severity as IncidentSeverity
  }
  if (params.resolved !== undefined) {
    where.resolved = params.resolved === 'true'
  }

  // Get incidents
  const [incidents, total] = await Promise.all([
    prisma.securityIncident.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: itemsPerPage,
      skip: (currentPage - 1) * itemsPerPage,
    }),
    prisma.securityIncident.count({ where }),
  ])

  // Get statistics
  const [totalIncidents, unresolvedIncidents, byType, bySeverity] = await Promise.all([
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

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <div className="min-h-screen bg-app-bg p-8 font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-app-heading">🔒 Security Incidents</h1>
        <p className="text-app-body mt-1">ติดตามและจัดการเหตุการณ์ด้านความปลอดภัย</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-app-card rounded-lg shadow-sm border border-app p-4">
          <div className="text-sm text-app-muted">Total Incidents</div>
          <div className="text-2xl font-bold text-app-heading mt-1">{totalIncidents}</div>
        </div>
        <div className="bg-app-card rounded-lg shadow-sm border border-app p-4">
          <div className="text-sm text-app-muted">Unresolved</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{unresolvedIncidents}</div>
        </div>
        <div className="bg-app-card rounded-lg shadow-sm border border-app p-4">
          <div className="text-sm text-app-muted">By Type</div>
          <div className="text-lg font-semibold text-app-heading mt-1">{byType.length} types</div>
        </div>
        <div className="bg-app-card rounded-lg shadow-sm border border-app p-4">
          <div className="text-sm text-app-muted">By Severity</div>
          <div className="text-lg font-semibold text-app-heading mt-1">{bySeverity.length} levels</div>
        </div>
      </div>

      <SecurityIncidentsClient
        incidents={incidents.map(incident => ({
          ...incident,
          metadata: incident.metadata ? JSON.parse(incident.metadata) : null,
        }))}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={total}
        itemsPerPage={itemsPerPage}
        filters={{
          type: params.type,
          severity: params.severity,
          resolved: params.resolved,
        }}
      />
    </div>
  )
}



