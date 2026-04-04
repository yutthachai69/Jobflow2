'use client'

import { useState } from 'react'
import { getWorkOrderDisplayNumber } from '@/lib/work-order-number'
import { buildAirborneReportHtml, AIRBORNE_REPORT_CSS } from '@/lib/airborne-report-html'
import { buildExhaustFanReportHtml, EXHAUST_REPORT_CSS } from '@/lib/exhaust-fan-report-html'
import { getPmWashTypeLabelThai } from '@/lib/pm-wash-label'

type PhotoType = 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER'

interface JobItemForReport {
  id: string
  status: string
  techNote?: string | null
  checklist?: string | null
  asset: {
    qrCode: string
    name?: string | null
    room?: {
      name: string
      floor?: { name?: string; building?: { name?: string; site?: { name: string } } }
    } | null
  }
  technician?: { fullName: string | null; username: string } | null
  photos?: Array<{ id: string; url: string; type: PhotoType }>
  adHocPmType?: 'MAJOR' | 'MINOR' | null
  pmSchedule?: { pmType: 'MAJOR' | 'MINOR' } | null
}

interface WorkOrderForReport {
  id: string
  workOrderNumber?: string | null
  jobType: string
  scheduledDate: Date | string
  status: string
  site: { name: string; client: { name: string } }
}

interface Props {
  jobItem: JobItemForReport
  workOrder: WorkOrderForReport
}

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
  BEFORE: 'ก่อนทำ',
  AFTER: 'หลังทำ',
  DEFECT: 'ข้อบกพร่อง',
  METER: 'มิเตอร์',
}

export default function JobItemReportDownloadButton({ jobItem, workOrder }: Props) {
  const [isExporting, setIsExporting] = useState(false)

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

  function locationString(): string {
    const r = jobItem.asset?.room
    if (!r) return workOrder.site.name
    const b = r.floor?.building
    if (!b) return workOrder.site.name
    return [b.site?.name || workOrder.site.name, b.name, r.floor?.name, r.name].filter(Boolean).join(' → ')
  }

  function exportToPDF() {
    setIsExporting(true)
    try {
      const workOrderNumber = getWorkOrderDisplayNumber(workOrder)
      const printPhotos = (jobItem.photos || []).filter((p) => p.type === 'BEFORE')
      const photosHtml =
        printPhotos.length === 0
          ? '<p class="text-muted">ไม่มีรูปก่อนทำ</p>'
          : printPhotos
              .map(
                (p) => `
                <div class="photo-block">
                  <span class="photo-label">${photoTypeLabels[p.type] || p.type}</span>
                  <img src="${imgSrc(p.url)}" alt="${photoTypeLabels[p.type] || p.type}" class="report-photo" loading="lazy" />
                </div>`
              )
              .join('')
      const techNoteHtml = jobItem.techNote
        ? `<p class="tech-note"><strong>หมายเหตุช่าง:</strong> ${escapeHtml(jobItem.techNote)}</p>`
        : ''
      const pmWashLabel = getPmWashTypeLabelThai(workOrder.jobType, jobItem)
      const pmWashHtml = pmWashLabel
        ? `<p><strong>ประเภทการล้าง:</strong> ${escapeHtml(pmWashLabel)}</p>`
        : ''

      const reportItemHtml = `
        <div class="report-item">
          <h3>รายการงาน: ${escapeHtml(jobItem.asset.qrCode)}</h3>
          <p><strong>สถานที่:</strong> ${escapeHtml(locationString())}</p>
          ${pmWashHtml}
          <p><strong>ช่าง:</strong> ${escapeHtml(jobItem.technician?.fullName || jobItem.technician?.username || '-')} &nbsp;|&nbsp; <strong>สถานะ:</strong> ${jobItemStatusLabels[jobItem.status] || jobItem.status}</p>
          ${techNoteHtml}
          <div class="photos-section">
            <p class="photos-title">รูปภาพก่อนทำ</p>
            <div class="photos-grid">${photosHtml}</div>
          </div>
        </div>`

      // เลือกฟอร์มรายงานตาม formType ใน checklist (ตามที่แอดมินเลือกตอนสร้างใบงาน)
      let formReportHtml = ''
      let formReportCss = ''
      let formType = 'AIRBORNE_INFECTION'
      if (jobItem.checklist) {
        try {
          const parsed = JSON.parse(jobItem.checklist) as { formType?: string }
          if (parsed?.formType) formType = parsed.formType === 'CLEAN_ROOM' ? 'AIRBORNE_INFECTION' : parsed.formType
        } catch {
          // keep default
        }
      }
      const asset = jobItem.asset as { qrCode?: string; assetType?: string }
      if (formType === 'AIRBORNE_INFECTION' && asset && (asset.assetType === 'EXHAUST' || (asset.qrCode || '').startsWith('EX-'))) {
        formType = 'EXHAUST_FAN'
      }
      const includeFormInPrint =
        (workOrder.jobType === 'PM' || workOrder.jobType === 'CM') &&
        !!jobItem.checklist
      if (includeFormInPrint && jobItem.checklist) {
        const checklistStr = jobItem.checklist
        const formPmOpts = { pmWashLabel }
        if (formType === 'EXHAUST_FAN') {
          formReportHtml = buildExhaustFanReportHtml(
            { checklist: checklistStr, asset: jobItem.asset },
            workOrder,
            formPmOpts
          )
          formReportCss = EXHAUST_REPORT_CSS
        } else {
          formReportHtml = buildAirborneReportHtml(
            { checklist: checklistStr, asset: jobItem.asset },
            workOrder,
            formPmOpts
          )
          formReportCss = AIRBORNE_REPORT_CSS
        }
      }

      const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงานงาน - ${workOrderNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Kanit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @media print {
      @page { margin: 1cm; }
      body { margin: 0; padding: 0; }
      .report-photo { max-height: 280px; }
    }
    body {
      font-family: 'Sarabun', 'Kanit', sans-serif;
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
    .report-item { margin-top: 16px; }
    .tech-note { margin: 8px 0; padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 14px; }
    .photos-section { margin-top: 12px; }
    .photos-title { font-weight: bold; margin-bottom: 8px; color: #334155; font-size: 14px; }
    .photos-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .photo-block { display: inline-block; text-align: center; vertical-align: top; }
    .photo-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
    .report-photo {
      max-width: 220px; max-height: 220px; object-fit: contain;
      border: 1px solid #cbd5e1; border-radius: 8px;
    }
    .text-muted { color: #64748b; font-size: 14px; }
    ${formReportCss}
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
    <p><strong>สถานะงาน:</strong> ${statusLabels[workOrder.status] || workOrder.status}</p>
  </div>
  <h2>รายละเอียดงานและรูปก่อนทำ</h2>
  ${reportItemHtml}
  ${formReportHtml}
</body>
</html>`

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาต popup')
      }
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      const hasPhotos = printPhotos.length > 0
      const hasFormReport = !!formReportHtml
      const waitMs = hasFormReport ? 1500 : hasPhotos ? 1200 : 600

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setIsExporting(false)
        }, waitMs)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      setIsExporting(false)
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออก PDF')
    }
  }

  return (
    <button
      type="button"
      onClick={exportToPDF}
      disabled={isExporting}
      className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isExporting ? 'กำลังเตรียม PDF...' : 'ดาวน์โหลด Report'}
    </button>
  )
}
