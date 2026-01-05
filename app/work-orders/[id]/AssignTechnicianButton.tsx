'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { assignTechnicianToJobItem } from '@/app/actions'
import toast from 'react-hot-toast'

interface Technician {
  id: string
  username: string
  fullName: string | null
}

interface Props {
  jobItemId: string
  currentTechnicianId: string | null
  technicians: Technician[]
}

export default function AssignTechnicianButton({ jobItemId, currentTechnicianId, technicians }: Props) {
  const router = useRouter()
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(currentTechnicianId || '')
  const [isAssigning, setIsAssigning] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  async function handleAssign() {
    if (selectedTechnicianId === currentTechnicianId) {
      setShowDropdown(false)
      return
    }

    setIsAssigning(true)

    try {
      await assignTechnicianToJobItem(jobItemId, selectedTechnicianId || null)
      toast.success('มอบหมายช่างเรียบร้อยแล้ว')
      router.refresh()
      setShowDropdown(false)
    } catch (error) {
      console.error('Error assigning technician:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการมอบหมายช่าง'
      toast.error(errorMessage)
    } finally {
      setIsAssigning(false)
    }
  }

  const currentTechnician = technicians.find(t => t.id === currentTechnicianId)

  if (showDropdown) {
    return (
      <div className="flex flex-col gap-2 min-w-[200px]">
        <select
          value={selectedTechnicianId}
          onChange={(e) => setSelectedTechnicianId(e.target.value)}
          disabled={isAssigning}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">-- ไม่มอบหมาย --</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.fullName || tech.username}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={handleAssign}
            disabled={isAssigning}
            className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? 'กำลังมอบหมาย...' : 'ยืนยัน'}
          </button>
          <button
            onClick={() => {
              setShowDropdown(false)
              setSelectedTechnicianId(currentTechnicianId || '')
            }}
            disabled={isAssigning}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowDropdown(true)}
      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
      title={currentTechnician ? `ช่างปัจจุบัน: ${currentTechnician.fullName || currentTechnician.username}` : 'ยังไม่ได้มอบหมาย'}
    >
      {currentTechnician ? `✏️ ${currentTechnician.fullName || currentTechnician.username}` : 'มอบหมายช่าง'}
    </button>
  )
}
