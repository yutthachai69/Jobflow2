'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import AlertDialog from '@/app/components/AlertDialog'

interface WorkOrder {
  id: string
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

  function exportToPDF() {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(18)
      doc.text('ใบสั่งงาน', 105, 20, { align: 'center' })
      
      // Work Order Info
      doc.setFontSize(12)
      let y = 35
      doc.text(`ID: ${workOrder.id}`, 20, y)
      y += 7
      doc.text(`ชนิดงาน: ${workOrder.jobType}`, 20, y)
      y += 7
      doc.text(`สถานที่: ${workOrder.site.name}`, 20, y)
      y += 7
      doc.text(`ลูกค้า: ${workOrder.site.client.name}`, 20, y)
      y += 7
      doc.text(`วันนัดหมาย: ${new Date(workOrder.scheduledDate).toLocaleDateString('th-TH')}`, 20, y)
      y += 7
      doc.text(`สถานะ: ${workOrder.status}`, 20, y)
      y += 10

      // Job Items Table
      doc.setFontSize(14)
      doc.text('รายการงาน', 20, y)
      y += 10

      doc.setFontSize(10)
      const tableData = workOrder.jobItems.map((item, index) => [
        index + 1,
        item.asset.qrCode,
        `${item.asset.brand || ''} ${item.asset.model || ''}`.trim(),
        item.technician?.fullName || item.technician?.username || '-',
        item.status,
      ])

      // Simple table
      doc.text('ลำดับ', 20, y)
      doc.text('QR Code', 50, y)
      doc.text('เครื่อง', 90, y)
      doc.text('ช่าง', 140, y)
      doc.text('สถานะ', 180, y)
      y += 7

      tableData.forEach((row) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        doc.text(row[0].toString(), 20, y)
        doc.text(row[1].toString(), 50, y)
        doc.text(row[2].toString(), 90, y)
        doc.text(row[3].toString(), 140, y)
        doc.text(row[4].toString(), 180, y)
        y += 7
      })

      doc.save(`work-order-${workOrder.id}.pdf`)
      setAlert({
        isOpen: true,
        title: 'ส่งออกสำเร็จ',
        message: 'ส่งออก PDF เรียบร้อยแล้ว',
        type: 'success',
      })
    } catch (error) {
      console.error('Error exporting PDF:', error)
      setAlert({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        message: 'เกิดข้อผิดพลาดในการส่งออก PDF',
        type: 'error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  function exportToExcel() {
    setIsExporting(true)
    try {
      // Prepare data
      const worksheetData = [
        ['ใบสั่งงาน'],
        ['ID', workOrder.id],
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
      XLSX.writeFile(wb, `work-order-${workOrder.id}.xlsx`)
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

