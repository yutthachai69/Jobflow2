'use client'

import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import AlertDialog from '@/app/components/AlertDialog'
import { getWorkOrderDisplayNumber } from '@/lib/work-order-number'

interface WorkOrder {
  id: string
  workOrderNumber?: string | null
  jobType: string
  scheduledDate: Date
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
    asset: {
      qrCode: string
      brand: string | null
      model: string | null
    }
    technician: {
      fullName: string | null
      username: string
    } | null
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
  const printWindowRef = useRef<Window | null>(null)

  function exportToPDF() {
    setIsExporting(true)
    try {
      // สร้าง HTML content สำหรับ PDF
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

      const workOrderNumber = getWorkOrderDisplayNumber(workOrder)

      const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ใบสั่งงาน - ${workOrderNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Kanit:wght@400;500;600;700&family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @media print {
      @page {
        margin: 1cm;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: 'Sarabun', 'Kanit', 'Prompt', 'Sans-serif', Arial, sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      color: #000;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 30px;
      color: #1e40af;
    }
    h2 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      margin-top: 30px;
      color: #1e40af;
    }
    .info-section {
      margin-bottom: 30px;
    }
    .info-section p {
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    thead tr {
      background-color: #3b82f6;
      color: white;
    }
    th, td {
      border: 1px solid #1e40af;
      padding: 10px;
    }
    th {
      text-align: center;
      font-weight: bold;
    }
    tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .text-center {
      text-align: center;
    }
    .text-left {
      text-align: left;
    }
  </style>
</head>
<body>
  <h1>ใบสั่งงาน</h1>
  
  <div class="info-section">
    <p><strong>เลขที่งาน:</strong> ${workOrderNumber}</p>
    <p><strong>ชนิดงาน:</strong> ${jobTypeLabels[workOrder.jobType] || workOrder.jobType}</p>
    <p><strong>สถานที่:</strong> ${workOrder.site.name}</p>
    <p><strong>ลูกค้า:</strong> ${workOrder.site.client.name}</p>
    <p><strong>วันนัดหมาย:</strong> ${new Date(workOrder.scheduledDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>สถานะ:</strong> ${statusLabels[workOrder.status] || workOrder.status}</p>
  </div>

  <h2>รายการงาน</h2>
  
  <table>
    <thead>
      <tr>
        <th>ลำดับ</th>
        <th class="text-left">QR Code</th>
        <th class="text-left">ยี่ห้อ/รุ่น</th>
        <th class="text-left">ช่าง</th>
        <th>สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${workOrder.jobItems.map((item, index) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${item.asset.qrCode}</td>
          <td>${`${item.asset.brand || ''} ${item.asset.model || ''}`.trim() || '-'}</td>
          <td>${item.technician?.fullName || item.technician?.username || '-'}</td>
          <td class="text-center">${jobItemStatusLabels[item.status] || item.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
      `

      // เปิดหน้าต่างใหม่และแสดง HTML
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาต popup')
      }

      printWindowRef.current = printWindow
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // รอให้ content โหลดเสร็จแล้ว print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setIsExporting(false)
          setAlert({
            isOpen: true,
            title: 'พร้อมพิมพ์',
            message: 'กรุณาเลือก "Save as PDF" ในหน้าต่าง Print',
            type: 'success',
          })
        }, 500)
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

  // Cleanup print window on unmount
  useEffect(() => {
    return () => {
      if (printWindowRef.current && !printWindowRef.current.closed) {
        printWindowRef.current.close()
      }
    }
  }, [])

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
          `${item.asset.brand || ''} ${item.asset.model || ''}`.trim(),
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

      <AlertDialog
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />
    </>
  )
}

