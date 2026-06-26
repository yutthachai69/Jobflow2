'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface DuplicateWorkOrder {
  id: string
  workOrderNumber: string | null
  jobType: string
  status: string
  siteName: string
  scheduledDate: Date
  assets: string
}

interface Props {
  isOpen: boolean
  duplicates: DuplicateWorkOrder[]
  message: string
  formData: FormData
  onClose: () => void
}

function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { message?: string; digest?: string }
  return err.message === 'NEXT_REDIRECT' || (typeof err.digest === 'string' && err.digest.includes('NEXT_REDIRECT'))
}

export default function DuplicateWorkOrderDialog({ isOpen, duplicates, message, formData, onClose }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmDuplicate, setConfirmDuplicate] = useState(false)
  const [duplicateReason, setDuplicateReason] = useState('')
  const [duplicateReasonNote, setDuplicateReasonNote] = useState('')

  if (!isOpen) return null

  const handleForceCreate = async () => {
    setIsSubmitting(true)
    try {
      // Add force create flag to form data
      const newFormData = new FormData()
      // Copy all existing form data
      for (const [key, value] of formData.entries()) {
        newFormData.set(key, value)
      }
      newFormData.set('forceCreate', 'true')
      if (duplicates.length > 0) {
        // Keep reference to one original duplicate for later traceability.
        newFormData.set('duplicateOfId', duplicates[0].id)
      }
      newFormData.set('duplicateReason', duplicateReason)
      newFormData.set('duplicateReasonNote', duplicateReasonNote.trim())
      
      // Import and call createWorkOrder
      const { createWorkOrder } = await import('@/app/actions/work-orders')
      const result = await createWorkOrder(newFormData)
      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        const message = 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'ไม่สามารถสร้างใบงานได้'
        const isDuplicateBlocked = 'duplicateBlocked' in result && result.duplicateBlocked === true
        if (isDuplicateBlocked) {
          toast(message, { icon: '⚠️' })
        } else {
          toast.error(message)
        }
        setIsSubmitting(false)
        return
      }
      
      // The action will handle redirect
    } catch (error) {
      if (isNextRedirectError(error)) {
        throw error
      }
      console.error('Error creating work order:', error)
      setIsSubmitting(false)
    }
  }

  const handleViewOriginal = (workOrderId: string) => {
    router.push(`/work-orders/${workOrderId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return 'เปิดงาน'
      case 'IN_PROGRESS': return 'กำลังดำเนินการ'
      case 'COMPLETED': return 'เสร็จสิ้น'
      case 'CANCELLED': return 'ยกเลิก'
      default: return status
    }
  }

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'PM': return '🔧'
      case 'CM': return '🛠️'
      case 'INSTALL': return '📦'
      default: return '📋'
    }
  }

  const getJobTypeText = (jobType: string) => {
    switch (jobType) {
      case 'PM': return 'งาน PM'
      case 'CM': return 'งาน CM'
      case 'INSTALL': return 'งานติดตั้ง'
      default: return jobType || 'ไม่ระบุประเภทงาน'
    }
  }

  const summaryMessage = `พบ ${duplicates.length} รายการที่อาจเป็นใบงานซ้ำ`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">พบใบงานที่อาจซ้ำกัน</h2>
              <p className="text-gray-700 mt-1">{summaryMessage}</p>
              {message && (
                <p className="text-sm text-gray-500 mt-1">{message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Duplicate List */}
        <div className="p-6">
          <div className="space-y-4">
            {duplicates.map((duplicate) => (
              <div key={duplicate.id} className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="text-lg">{getJobTypeIcon(duplicate.jobType)}</span>
                      <span className="font-semibold text-gray-900">เลขที่ใบงาน: {duplicate.workOrderNumber || 'ไม่ระบุ'}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {getJobTypeText(duplicate.jobType)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(duplicate.status)}`}>
                        {getStatusText(duplicate.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>สถานที่: {duplicate.siteName || 'ไม่ระบุสถานที่'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>วันที่นัดหมาย: {new Date(duplicate.scheduledDate).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                    
                    {duplicate.assets && (
                      <div className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">สินทรัพย์: </span>
                        <span>{duplicate.assets}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleViewOriginal(duplicate.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full md:w-auto"
                  >
                    ดูใบงานเดิม
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Warning Message */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div>
                <p className="font-medium text-yellow-800">โปรดตรวจสอบรายการก่อนสร้างใบงานใหม่</p>
                <p className="text-sm text-yellow-700 mt-1">
                  หากเลือกสร้างต่อ ระบบจะผูกใบงานใหม่นี้กับใบงานเดิมที่ซ้ำ เพื่อให้ย้อนดูความซ้ำย้อนหลังได้
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white border border-amber-200 rounded-xl">
            <p className="text-sm font-semibold text-gray-900 mb-2">เหตุผลที่ต้องเปิดงานซ้ำ</p>
            <select
              value={duplicateReason}
              onChange={(e) => setDuplicateReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800"
            >
              <option value="">-- เลือกเหตุผล --</option>
              <option value="urgent_rework">งานเร่งด่วน ต้องเปิดซ้ำทันที</option>
              <option value="different_scope">ขอบเขตงานคนละส่วน แม้เครื่องเดียวกัน</option>
              <option value="customer_request">ลูกค้าร้องขอให้เปิดเพิ่ม</option>
              <option value="data_correction">แก้ไขข้อมูลจากใบงานเดิม</option>
              <option value="other">อื่นๆ</option>
            </select>
            <textarea
              value={duplicateReasonNote}
              onChange={(e) => setDuplicateReasonNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={2}
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800"
            />
            <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={confirmDuplicate}
                onChange={(e) => setConfirmDuplicate(e.target.checked)}
                className="mt-0.5"
              />
              <span>ยืนยันว่าได้ตรวจสอบแล้ว และต้องการสร้างใบงานซ้ำตามเหตุผลข้างต้น</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleForceCreate}
            disabled={isSubmitting || !confirmDuplicate || !duplicateReason}
            className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>กำลังสร้างใบงาน...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>ยืนยันสร้างใบงานใหม่</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
