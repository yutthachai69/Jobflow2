'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { IncidentType, IncidentSeverity } from '@prisma/client'
import Pagination from '@/app/components/Pagination'
import ConfirmDialog from '@/app/components/ConfirmDialog'

interface Incident {
  id: string
  type: IncidentType
  severity: IncidentSeverity
  description: string
  metadata: any
  userId: string | null
  username: string | null
  ipAddress: string | null
  userAgent: string | null
  resolved: boolean
  resolvedAt: Date | null
  resolvedBy: string | null
  createdAt: Date
}

interface Props {
  incidents: Incident[]
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  filters: {
    type?: string
    severity?: string
    resolved?: string
  }
}

export default function SecurityIncidentsClient({
  incidents,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  filters,
}: Props) {
  const router = useRouter()
  const [resolving, setResolving] = useState<string | null>(null)
  const [showResolveConfirm, setShowResolveConfirm] = useState<string | null>(null)

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
    }
  }

  const getTypeLabel = (type: IncidentType) => {
    const labels: Record<string, string> = {
      FAILED_LOGIN: 'เข้าสู่ระบบล้มเหลว',
      ACCOUNT_LOCKED: 'บัญชีถูกล็อก',
      ACCOUNT_UNLOCKED: 'บัญชีถูกปลดล็อก',
      ACCOUNT_AUTO_LOCKED: 'บัญชีถูกล็อกอัตโนมัติ',
      LOGIN_ATTEMPT_LOCKED_ACCOUNT: 'พยายามเข้าสู่บัญชีที่ล็อก',
      LOGIN_RATE_LIMIT_EXCEEDED: 'เกินอัตราการเข้าสู่ระบบ',
      LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
      SECURITY_BREACH: 'การละเมิดความปลอดภัย',
      UNAUTHORIZED_ACCESS: 'การเข้าถึงโดยไม่ได้รับอนุญาต',
      SUSPICIOUS_ACTIVITY: 'กิจกรรมที่น่าสงสัย',
    }
    return labels[type] || type
  }

  async function handleResolve(incidentId: string) {
    if (resolving) return
    setResolving(incidentId)

    try {
      const response = await fetch('/api/security/incident', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resolve',
          incidentId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาด')
      }

      toast.success('แก้ไขเหตุการณ์สำเร็จ')
      router.refresh()
    } catch (error) {
      console.error('Error resolving incident:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด')
    } finally {
      setResolving(null)
    }
  }

  function buildFilterUrl(key: string, value: string | undefined) {
    const params = new URLSearchParams()
    if (key !== 'type' && filters.type) params.set('type', filters.type)
    if (key !== 'severity' && filters.severity) params.set('severity', filters.severity)
    if (key !== 'resolved' && filters.resolved) params.set('resolved', filters.resolved)
    if (value) params.set(key, value)
    return `/security-incidents?${params.toString()}`
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-6 bg-app-card rounded-lg shadow-sm border border-app p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-app-body mb-2">ประเภท</label>
            <select
              value={filters.type || 'ALL'}
              onChange={(e) => {
                router.push(buildFilterUrl('type', e.target.value === 'ALL' ? undefined : e.target.value))
              }}
              className="w-full border border-app rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-app-card text-app-body"
            >
              <option value="ALL">ทุกประเภท</option>
              {Object.values(IncidentType).map((type) => (
                <option key={type} value={type}>
                  {getTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-48">
            <label className="block text-sm font-medium text-app-body mb-2">ระดับความรุนแรง</label>
            <select
              value={filters.severity || 'ALL'}
              onChange={(e) => {
                router.push(buildFilterUrl('severity', e.target.value === 'ALL' ? undefined : e.target.value))
              }}
              className="w-full border border-app rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-app-card text-app-body"
            >
              <option value="ALL">ทุกระดับ</option>
              {Object.values(IncidentSeverity).map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-48">
            <label className="block text-sm font-medium text-app-body mb-2">สถานะ</label>
            <select
              value={filters.resolved || 'ALL'}
              onChange={(e) => {
                router.push(buildFilterUrl('resolved', e.target.value === 'ALL' ? undefined : e.target.value))
              }}
              className="w-full border border-app rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-app-card text-app-body"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="false">ยังไม่แก้ไข</option>
              <option value="true">แก้ไขแล้ว</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {incidents.length === 0 ? (
          <div className="bg-app-card rounded-lg border border-app p-8 text-center">
            <p className="text-app-muted">ไม่พบข้อมูล</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className="bg-app-card rounded-lg border border-app p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="text-xs text-app-muted mb-1">
                    {new Date(incident.createdAt).toLocaleString('th-TH')}
                  </div>
                  <div className="font-medium text-app-heading text-base mb-2">
                    {getTypeLabel(incident.type)}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </span>
              </div>

              <div className="space-y-2 mb-3 pb-3 border-b border-app">
                <div>
                  <div className="text-xs text-app-muted mb-1">รายละเอียด</div>
                  <div className="text-sm text-app-body">{incident.description}</div>
                </div>
                {(incident.username || incident.ipAddress) && (
                  <div>
                    <div className="text-xs text-app-muted mb-1">ผู้ใช้/IP</div>
                    {incident.username && (
                      <div className="text-sm font-medium text-app-heading">{incident.username}</div>
                    )}
                    {incident.ipAddress && (
                      <div className="text-xs text-app-muted">{incident.ipAddress}</div>
                    )}
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 mb-1">สถานะ</div>
                  {incident.resolved ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      แก้ไขแล้ว
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      ยังไม่แก้ไข
                    </span>
                  )}
                </div>
              </div>

              {!incident.resolved && (
                <button
                  onClick={() => setShowResolveConfirm(incident.id)}
                  disabled={resolving === incident.id}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {resolving === incident.id ? 'กำลังแก้ไข...' : 'แก้ไข'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border border-app rounded-lg shadow-sm bg-app-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-app-section uppercase font-medium border-b border-app">
            <tr>
              <th className="px-6 py-3 text-app-heading">วันที่/เวลา</th>
              <th className="px-6 py-3 text-app-heading">ประเภท</th>
              <th className="px-6 py-3 text-app-heading">ระดับ</th>
              <th className="px-6 py-3 text-app-heading">รายละเอียด</th>
              <th className="px-6 py-3 text-app-heading">ผู้ใช้/IP</th>
              <th className="px-6 py-3 text-app-heading">สถานะ</th>
              <th className="px-6 py-3 text-app-heading">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-app-muted">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-app-accent">
                  <td className="px-6 py-4 text-app-muted text-xs">
                    {new Date(incident.createdAt).toLocaleString('th-TH')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-app-heading">
                      {getTypeLabel(incident.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-app-body text-sm max-w-md">
                    {incident.description}
                  </td>
                  <td className="px-6 py-4 text-app-muted text-xs">
                    <div>
                      {incident.username && (
                        <div className="font-medium text-app-heading">{incident.username}</div>
                      )}
                      {incident.ipAddress && (
                        <div className="text-app-muted">{incident.ipAddress}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {incident.resolved ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        แก้ไขแล้ว
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        ยังไม่แก้ไข
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {!incident.resolved && (
                      <button
                        onClick={() => setShowResolveConfirm(incident.id)}
                        disabled={resolving === incident.id}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resolving === incident.id ? 'กำลังแก้ไข...' : 'แก้ไข'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {showResolveConfirm && (
        <ConfirmDialog
          isOpen={!!showResolveConfirm}
          title="แก้ไขเหตุการณ์"
          message="คุณต้องการแก้ไขเหตุการณ์นี้ใช่หรือไม่?"
          confirmText="แก้ไข"
          cancelText="ยกเลิก"
          confirmColor="green"
          onConfirm={() => {
            if (showResolveConfirm) {
              handleResolve(showResolveConfirm)
            }
            setShowResolveConfirm(null)
          }}
          onCancel={() => setShowResolveConfirm(null)}
          isLoading={resolving === showResolveConfirm}
        />
      )}
    </>
  )
}

