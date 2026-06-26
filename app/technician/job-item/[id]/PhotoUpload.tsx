'use client'

import { useState, useRef } from 'react'
import { createJobPhoto } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { compressImageForUpload } from '@/lib/client-image-compress'
import {
  getCompressTargetBytes,
  getMaxUploadBytes,
  getMaxUploadLabelMb,
} from '@/lib/upload-config'

interface Props {
  jobItemId: string
  defaultPhotoType?: 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER'
  isCM?: boolean
}

async function parseUploadError(res: Response): Promise<string> {
  const raw = await res.text()
  const trimmed = raw.trimStart()
  if (trimmed.startsWith('{')) {
    try {
      const j = JSON.parse(raw) as { error?: string }
      if (typeof j.error === 'string' && j.error.length > 0) {
        if (j.error.includes('JWS Protected Header')) {
          return 'ตั้งค่า Supabase ไม่ถูกต้อง (คีย์เซิร์ฟเวอร์) — ตรวจ SUPABASE_SERVICE_ROLE_KEY ให้ตรงโปรเจกต์'
        }
        return j.error
      }
    } catch {
      /* fall through */
    }
  }
  if (res.status === 413) {
    return 'ไฟล์ใหญ่เกินที่เซิร์ฟเวอร์รับได้ ลองเลือกรูปอื่นหรือถ่ายใหม่'
  }
  if (res.status === 401) {
    return 'หมดเซสชันหรือไม่มีสิทธิ์อัปโหลด — กรุณาเข้าสู่ระบบใหม่'
  }
  if (res.status === 429) {
    return 'อัปโหลดบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'
  }
  return raw.length > 0 && raw.length < 280
    ? raw
    : `อัปโหลดไม่สำเร็จ (${res.status})`
}

export default function PhotoUpload({ jobItemId, defaultPhotoType = 'BEFORE', isCM = false }: Props) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoType, setPhotoType] = useState<'BEFORE' | 'AFTER' | 'DEFECT' | 'METER'>(defaultPhotoType)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const maxBytes = getMaxUploadBytes()
  const labelMb = getMaxUploadLabelMb()

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadPhoto(file, photoType)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  async function uploadPhoto(file: File, photoType: 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER') {
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const target = getCompressTargetBytes()
      const prepared = await compressImageForUpload(file, target)

      if (prepared.size > maxBytes) {
        setError(`ไฟล์ยังใหญ่เกินไปหลังบีบแล้ว (สูงสุด ${labelMb}MB) — ลองเลือกรูปอื่น`)
        return
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', prepared)
      uploadFormData.append('photoType', photoType)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
        credentials: 'include',
      })

      if (!uploadResponse.ok) {
        const msg = await parseUploadError(uploadResponse)
        throw new Error(msg)
      }

      const { url } = (await uploadResponse.json()) as { url: string }

      const formData = new FormData()
      formData.append('imageUrl', url)
      formData.append('photoType', photoType)

      await createJobPhoto(jobItemId, formData)

      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ประเภทรูปภาพ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(isCM ? ['DEFECT'] as const : ['BEFORE', 'AFTER', 'DEFECT', 'METER'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPhotoType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${photoType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {type === 'BEFORE' && 'ก่อนทำ'}
                {type === 'AFTER' && 'หลังทำ'}
                {type === 'DEFECT' && 'จุดชำรุด'}
                {type === 'METER' && 'ค่าเกจ'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            <div className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-center flex items-center justify-center gap-2">
              <span>{isUploading ? 'กำลังอัปโหลด...' : 'เลือกรูปจากแกลเลอรี'}</span>
            </div>
          </label>

          <label className="flex-1 cursor-pointer">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            <div className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-center flex items-center justify-center gap-2">
              <span>{isUploading ? 'กำลังอัปโหลด...' : 'ถ่ายรูปด้วยกล้อง'}</span>
            </div>
          </label>
        </div>

        <div className="text-xs text-gray-500 text-center">
          รองรับ JPG, PNG, GIF, WebP — ระบบจะบีบรูปจากกล้อง/แกลเลอรีให้เล็กลงอัตโนมัติ (ส่งไม่เกิน {labelMb}MB)
        </div>
      </>
    </div>
  )
}
