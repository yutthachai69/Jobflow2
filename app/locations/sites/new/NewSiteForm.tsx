'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSiteWithStructure } from '@/app/actions'
import Tooltip from '@/app/components/Tooltip'
import SiteMapPicker from '@/app/components/SiteMapPicker'
import toast from 'react-hot-toast'

interface Props {
  clients: { id: string; name: string }[]
  defaultClientId?: string
}

export default function NewSiteForm({ clients, defaultClientId }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      const result = await createSiteWithStructure(formData)
      if (result.success) {
        toast.success('บันทึกสถานที่ อาคาร ชั้น ห้องเรียบร้อยแล้ว')
        router.push('/locations')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              ลูกค้า <span className="text-red-500">*</span>
              <Tooltip content="เลือกองค์กรลูกค้าที่สถานที่นี้สังกัด">
                <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ℹ️</span>
              </Tooltip>
            </span>
          </label>
          <select
            name="clientId"
            defaultValue={defaultClientId || ''}
            aria-label="เลือกลูกค้า"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900"
          >
            <option value="">-- เลือกลูกค้า --</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-blue-700 mb-3">📍 สถานที่</h3>
          <div className="space-y-4 pl-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสถานที่ <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น สุขุมวิท, โรงงาน A, สำนักงานใหญ่"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
              <textarea
                name="address"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white resize-none text-gray-900 placeholder:text-gray-400"
                placeholder="ที่อยู่เต็ม (ไม่บังคับ)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งบนแผนที่</label>
              <SiteMapPicker />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 ชื่ออาคาร <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="buildingName"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="เช่น อาคาร A, อาคารหลัก"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 ชื่อชั้น <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="floorName"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="เช่น ชั้น 1, G (Ground), ชั้น 2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">🚪 ชื่อห้อง/โซน <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="roomName"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="เช่น Lobby, ห้องประชุม 1, Server Room"
          />
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-gray-700">
            <strong>บันทึกครั้งเดียว</strong> — ระบบจะสร้างสถานที่ อาคาร ชั้น และห้องในคราวเดียวกัน แล้วกลับไปหน้ารายการ
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="บันทึกสถานที่ อาคาร ชั้น ห้อง"
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
          >
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}</span>
          </button>
          <Link
            href="/locations"
            className="sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            ยกเลิก
          </Link>
        </div>
      </div>
    </form>
  )
}
