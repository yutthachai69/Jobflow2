'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WorkOrderForm from './WorkOrderForm'
import DuplicateWorkOrderDialog from '@/app/components/DuplicateWorkOrderDialog'
import { createWorkOrder } from '@/app/actions/work-orders'
import toast from 'react-hot-toast'

interface DuplicateData {
  duplicates: Array<{
    id: string
    workOrderNumber: string | null
    jobType: string
    status: string
    siteName: string
    scheduledDate: Date
    assets: string
  }>
  message: string
  formData: FormData
}

interface Props {
  sites: any[]
  technicians: any[]
  prefill?: any
}

function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { message?: string; digest?: string }
  return err.message === 'NEXT_REDIRECT' || (typeof err.digest === 'string' && err.digest.includes('NEXT_REDIRECT'))
}

export default function WorkOrderFormWithDuplicateCheck({ sites, technicians, prefill }: Props) {
  const router = useRouter()
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateData, setDuplicateData] = useState<DuplicateData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    
    try {
      const result = await createWorkOrder(formData)
      
      // Check if result requires confirmation for duplicates
      if (result && typeof result === 'object' && 'requiresConfirmation' in result) {
        const normalizedDuplicates = (() => {
          if ('details' in result && Array.isArray(result.details) && result.details.length > 0) {
            return result.details
          }

          if ('duplicates' in result && Array.isArray(result.duplicates)) {
            return result.duplicates.map((wo: any) => ({
              id: wo.id,
              workOrderNumber: wo.workOrderNumber ?? null,
              jobType: wo.jobType,
              status: wo.status,
              siteName: wo.site?.name || 'ไม่ระบุสถานที่',
              scheduledDate: wo.scheduledDate,
              assets: wo.jobItems?.map((item: any) => item.asset?.qrCode || '').filter(Boolean).join(', ') || ''
            }))
          }

          return []
        })()

        setDuplicateData({
          duplicates: normalizedDuplicates,
          message: typeof result.message === 'string' ? result.message : 'พบใบงานที่อาจซ้ำกัน',
          formData: formData
        })
        setShowDuplicateDialog(true)
        setIsSubmitting(false)
        return
      }

      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        const message = 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'ไม่สามารถสร้างใบงานได้'
        const isDuplicateBlocked = 'duplicateBlocked' in result && result.duplicateBlocked === true
        const isPmHardBlock = 'pmHardBlock' in result && result.pmHardBlock === true
        if (isPmHardBlock) {
          // PM hard-block: ไม่มีทางสร้างซ้ำได้เลย แสดงข้อความชัดเจน
          toast.error(message, { duration: 5000 })
        } else if (isDuplicateBlocked) {
          toast(message, { icon: '⚠️' })
        } else {
          toast.error(message)
        }
        setIsSubmitting(false)
        return
      }
      
      // If successful, redirect to work orders list
      router.push('/work-orders')
    } catch (error) {
      if (isNextRedirectError(error)) {
        throw error
      }
      console.error('Error creating work order:', error)
      setIsSubmitting(false)
    }
  }

  const handleDuplicateDialogClose = () => {
    setShowDuplicateDialog(false)
    setDuplicateData(null)
    setIsSubmitting(false)
  }

  return (
    <>
      <WorkOrderForm 
        sites={sites} 
        technicians={technicians} 
        prefill={prefill}
        onSubmit={handleFormSubmit} 
        isSubmitting={isSubmitting} 
      />
      
      {/* Duplicate Confirmation Dialog */}
      {showDuplicateDialog && duplicateData && (
        <DuplicateWorkOrderDialog
          isOpen={showDuplicateDialog}
          duplicates={duplicateData.duplicates}
          message={duplicateData.message}
          formData={duplicateData.formData}
          onClose={handleDuplicateDialogClose}
        />
      )}
    </>
  )
}
