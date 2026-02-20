'use client'

import { useState, useRef } from 'react'
import { createJobPhoto } from '@/app/actions'
import { useRouter } from 'next/navigation'

interface Props {
  jobItemId: string
  defaultPhotoType?: 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER'
}

export default function PhotoUpload({ jobItemId, defaultPhotoType = 'BEFORE' }: Props) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoType, setPhotoType] = useState<'BEFORE' | 'AFTER' | 'DEFECT' | 'METER'>(defaultPhotoType)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadPhoto(file, photoType)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function uploadPhoto(file: File, photoType: 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER') {
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Upload to blob storage first
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('photoType', photoType)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const { url } = await uploadResponse.json()

      // Then create job photo record
      const formData = new FormData()
      formData.append('imageUrl', url)
      formData.append('photoType', photoType)

      await createJobPhoto(jobItemId, formData)

      // Refresh page to show new photo
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
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
        {/* Photo Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ประเภทรูปภาพ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['BEFORE', 'AFTER', 'DEFECT', 'METER'] as const).map((type) => (
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
          {/* Upload from Gallery */}
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

          {/* Take Photo - native camera (works on all mobile browsers) */}
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
          รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 10MB
        </div>
      </>
    </div>
  )
}

