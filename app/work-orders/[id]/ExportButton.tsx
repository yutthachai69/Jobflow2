'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import AlertDialog from '@/app/components/AlertDialog'
import { getWorkOrderDisplayNumber } from '@/lib/work-order-number'
import { buildAirborneReportHtml, AIRBORNE_REPORT_CSS } from '@/lib/airborne-report-html'
import { buildExhaustFanReportHtml, EXHAUST_REPORT_CSS } from '@/lib/exhaust-fan-report-html'

// ใช้ตัวแปรระดับโมดูลเพื่อกันการแสดง Alert ซ้ำระหว่าง onload หลายครั้งหรือ Strict Mode remount
let hasShownPrintAlertThisSession = false

type PhotoType = 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER'

interface WorkOrder {
  id: string
  workOrderNumber?: string | null
  jobType: string
  scheduledDate: Date | string
  status: string
  site: {
    name: string
    client: {
      name: string
    }
  }
  jobItems: Array<{
    id: string
    status: string
    techNote?: string | null
    startTime?: Date | string | null
    checklist?: string | null
    asset: {
      qrCode: string
      name?: string | null
      room?: {
        name: string
        floor: {
          name: string
          building: {
            name: string
            site: { name: string }
          }
        }
      } | null
    }
    technician: {
      fullName: string | null
      username: string
    } | null
    photos?: Array<{ id: string; url: string; type: PhotoType }>
  }>
}

interface Props {
  workOrder: WorkOrder
}

export default function ExportButton({ workOrder }: Props) {
  const [isExporting, setIsExporting] = useState(false)
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'success' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error',
  })

  function escapeHtml(text: string): string {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function imgSrc(url: string): string {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return origin + (url.startsWith('/') ? url : '/' + url)
  }

  function exportToPDF() {
    setIsExporting(true)
    try {
      const jobTypeLabels: Record<string, string> = {
        PM: 'บำรุงรักษา',
        CM: 'ซ่อมแซม',
        INSTALL: 'ติดตั้ง',
      }
      const statusLabels: Record<string, string> = {
        OPEN: 'เปิด',
        IN_PROGRESS: 'กำลังดำเนินการ',
        COMPLETED: 'เสร็จสิ้น',
        CANCELLED: 'ยกเลิก',
      }
      const jobItemStatusLabels: Record<string, string> = {
        PENDING: 'รอดำเนินการ',
        IN_PROGRESS: 'กำลังดำเนินการ',
        DONE: 'เสร็จสิ้น',
        ISSUE_FOUND: 'พบปัญหา',
      }
      const photoTypeLabels: Record<PhotoType, string> = {
        BEFORE: 'ก่อน',
        AFTER: 'หลัง',
        DEFECT: 'ข้อบกพร่อง',
        METER: 'มิเตอร์',
      }

      const workOrderNumber = getWorkOrderDisplayNumber(workOrder)

      function locationString(item: WorkOrder['jobItems'][0]): string {
        const r = item.asset?.room
        if (!r) return workOrder.site.name
        const b = r.floor?.building
        if (!b) return workOrder.site.name
        return [b.site?.name || workOrder.site.name, b.name, r.floor?.name, r.name].filter(Boolean).join(' → ')
      }

      const reportItemsHtml = workOrder.jobItems.map((item, index) => {
        const photos = item.photos || []
        const photosHtml =
          photos.length === 0
            ? '<p class="text-muted">ไม่มีรูปภาพ</p>'
            : photos
                .map(
                  (p) => `
                <div class="photo-block">
                  <span class="photo-label">${photoTypeLabels[p.type] || p.type}</span>
                  <img src="${imgSrc(p.url)}" alt="${photoTypeLabels[p.type] || p.type}" class="report-photo" loading="lazy" />
                </div>`
                )
                .join('')
        const techNoteHtml = item.techNote ? `<p class="tech-note"><strong>หมายเหตุช่าง:</strong> ${escapeHtml(item.techNote)}</p>` : ''
        return `
        <div class="report-item">
          <h3>รายการที่ ${index + 1}: ${escapeHtml(item.asset.qrCode)}</h3>
          <p><strong>สถานที่:</strong> ${escapeHtml(locationString(item))}</p>
          <p><strong>ช่าง:</strong> ${escapeHtml(item.technician?.fullName || item.technician?.username || '-')} &nbsp;|&nbsp; <strong>สถานะ:</strong> ${jobItemStatusLabels[item.status] || item.status}</p>
          ${techNoteHtml}
          <div class="photos-section">
            <p class="photos-title">รูปภาพที่ช่างแนบ</p>
            <div class="photos-grid">${photosHtml}</div>
          </div>
        </div>`
      }).join('')

      const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ใบรายงาน - ${workOrderNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Kanit:wght@400;500;600;700&family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @media print {
      @page { margin: 1cm; }
      body { margin: 0; padding: 0; }
      .report-photo { max-height: 280px; }
    }
    body {
      font-family: 'Sarabun', 'Kanit', 'Prompt', 'Sans-serif', Arial, sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      color: #000;
    }
    h1 { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #1e40af; }
    h2 { font-size: 18px; font-weight: bold; margin-bottom: 12px; margin-top: 24px; color: #1e40af; }
    h3 { font-size: 16px; font-weight: bold; margin: 0 0 8px 0; color: #1e3a8a; }
    .info-section { margin-bottom: 24px; }
    .info-section p { margin: 5px 0; }
    .report-item {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #cbd5e1;
      page-break-inside: avoid;
    }
    .report-item:first-of-type { margin-top: 16px; padding-top: 0; border-top: none; }
    .tech-note { margin: 8px 0; padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 14px; }
    .photos-section { margin-top: 12px; }
    .photos-title { font-weight: bold; margin-bottom: 8px; color: #334155; font-size: 14px; }
    .photos-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .photo-block {
      display: inline-block;
      text-align: center;
      vertical-align: top;
    }
    .photo-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
    }
    .report-photo {
      max-width: 220px;
      max-height: 220px;
      object-fit: contain;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .text-muted { color: #64748b; font-size: 14px; }
    ${(function () {
      if (workOrder.jobType !== 'PM' && workOrder.jobType !== 'CM') return ''
      const hasChecklist = workOrder.jobItems.some((j) => j.checklist)
      if (!hasChecklist) return ''
      const hasExhaust = workOrder.jobItems.some((j) => {
        if (!j.checklist) return false
        try {
          const p = JSON.parse(j.checklist) as { formType?: string }
          if (p?.formType === 'EXHAUST_FAN') return true
          const asset = j.asset as { qrCode?: string; assetType?: string }
          return asset?.assetType === 'EXHAUST' || (asset?.qrCode || '').startsWith('EX-')
        } catch { return false }
      })
      return hasExhaust ? AIRBORNE_REPORT_CSS + EXHAUST_REPORT_CSS : AIRBORNE_REPORT_CSS
    })()}
  </style>
</head>
<body>
  <h1>ใบรายงาน</h1>
  <div class="info-section">
    <p><strong>เลขที่งาน:</strong> ${workOrderNumber}</p>
    <p><strong>ชนิดงาน:</strong> ${jobTypeLabels[workOrder.jobType] || workOrder.jobType}</p>
    <p><strong>สถานที่:</strong> ${escapeHtml(workOrder.site.name)}</p>
    <p><strong>ลูกค้า:</strong> ${escapeHtml(workOrder.site.client.name)}</p>
    <p><strong>วันนัดหมาย:</strong> ${new Date(workOrder.scheduledDate as Date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>สถานะ:</strong> ${statusLabels[workOrder.status] || workOrder.status}</p>
  </div>
  <h2>รายการงานและรูปภาพที่ช่างแนบ</h2>
  ${reportItemsHtml}
  ${(workOrder.jobType === 'PM' || workOrder.jobType === 'CM') ? workOrder.jobItems.filter((j) => j.checklist).map((j) => {
    let formType = 'AIRBORNE_INFECTION'
    try {
      const p = JSON.parse(j.checklist!) as { formType?: string }
      if (p?.formType) formType = p.formType === 'CLEAN_ROOM' ? 'AIRBORNE_INFECTION' : p.formType
    } catch { /* keep default */ }
    const asset = j.asset as { qrCode?: string; assetType?: string }
    if (formType === 'AIRBORNE_INFECTION' && asset && (asset.assetType === 'EXHAUST' || (asset.qrCode || '').startsWith('EX-'))) formType = 'EXHAUST_FAN'
    const jobForReport = { ...j, checklist: j.checklist ?? null }
    return formType === 'EXHAUST_FAN' ? buildExhaustFanReportHtml(jobForReport, workOrder) : buildAirborneReportHtml(jobForReport, workOrder)
  }).join('') : ''}
</body>
</html>
      `

      // กลับไปใช้วิธีเปิดหน้าต่าง Print แบบเดิม (ให้ผู้ใช้เลือก Save as PDF เอง)
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาต popup')
      }

      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // รอให้เนื้อหาและรูปโหลดก่อน แล้วค่อยสั่งพิมพ์
      printWindow.onload = () => {
        const hasPhotos = workOrder.jobItems.some((j) => (j.photos?.length ?? 0) > 0)
        const hasAirborneSheets =
          (workOrder.jobType === 'PM' || workOrder.jobType === 'CM') &&
          workOrder.jobItems.some((j) => j.checklist)
        const waitMs = hasAirborneSheets ? 1500 : hasPhotos ? 1200 : 600

        setTimeout(() => {
          printWindow.print()
          setIsExporting(false)

          if (!hasShownPrintAlertThisSession) {
            hasShownPrintAlertThisSession = true
            setAlert({
              isOpen: true,
              title: 'พร้อมพิมพ์',
              message: 'กรุณาเลือก "Save as PDF" ในหน้าต่าง Print',
              type: 'success',
            })
          }
        }, waitMs)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      setAlert({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออก PDF',
        type: 'error',
      })
      setIsExporting(false)
    }
  }

  function exportToExcel() {
    setIsExporting(true)
    try {
      // Prepare data
      const worksheetData = [
        ['ใบสั่งงาน'],
        ['เลขที่งาน', getWorkOrderDisplayNumber(workOrder)],
        ['ชนิดงาน', workOrder.jobType],
        ['สถานที่', workOrder.site.name],
        ['ลูกค้า', workOrder.site.client.name],
        ['วันนัดหมาย', new Date(workOrder.scheduledDate).toLocaleDateString('th-TH')],
        ['สถานะ', workOrder.status],
        [],
        ['รายการงาน'],
        ['ลำดับ', 'QR Code', 'ยี่ห้อ/รุ่น', 'ช่าง', 'สถานะ'],
        ...workOrder.jobItems.map((item, index) => [
          index + 1,
          item.asset.qrCode,
          '-',
          item.technician?.fullName || item.technician?.username || '-',
          item.status,
        ]),
      ]

      const ws = XLSX.utils.aoa_to_sheet(worksheetData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Work Order')
      XLSX.writeFile(wb, `work-order-${getWorkOrderDisplayNumber(workOrder)}.xlsx`)
      setAlert({
        isOpen: true,
        title: 'ส่งออกสำเร็จ',
        message: 'ส่งออก Excel เรียบร้อยแล้ว',
        type: 'success',
      })
    } catch (error) {
      console.error('Error exporting Excel:', error)
      setAlert({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        message: 'เกิดข้อผิดพลาดในการส่งออก Excel',
        type: 'error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const alertDialog = alert.isOpen ? (
    <AlertDialog
      key="export-alert"
      isOpen={true}
      title={alert.title}
      message={alert.message}
      type={alert.type}
      onClose={() => setAlert(prev => ({ ...prev, isOpen: false }))}
    />
  ) : null

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isExporting ? 'กำลังส่งออก...' : 'ส่งออก PDF'}
        </button>
        <button
          onClick={exportToExcel}
          disabled={isExporting}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isExporting ? 'กำลังส่งออก...' : 'ส่งออก Excel'}
        </button>
      </div>

      {typeof document !== 'undefined' && alertDialog
        ? createPortal(alertDialog, document.body)
        : alertDialog}
    </>
  )
}

