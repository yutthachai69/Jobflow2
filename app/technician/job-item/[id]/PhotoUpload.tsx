'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [showCamera, setShowCamera] = useState(false)
  const [photoType, setPhotoType] = useState<'BEFORE' | 'AFTER' | 'DEFECT' | 'METER'>(defaultPhotoType)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadPhoto(file, photoType)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function startCamera() {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setShowCamera(true)
      }
    } catch (err: any) {
      setError('ไม่สามารถเข้าถึงกล้องได้: ' + (err.message || 'กรุณาอนุญาตให้เข้าถึงกล้อง'))
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }

  function switchCamera() {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    stopCamera()
    setTimeout(() => startCamera(), 100)
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0)

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return

      // Convert blob to File
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      stopCamera()
      await uploadPhoto(file, photoType)
    }, 'image/jpeg', 0.9)
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopCamera()
    }
  }, [])

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

      {!showCamera ? (
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    photoType === type
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
              <div className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span>{isUploading ? 'กำลังอัปโหลด...' : 'เลือกรูปจากแกลเลอรี'}</span>
              </div>
            </label>

            {/* Take Photo from Camera */}
            <button
              type="button"
              onClick={startCamera}
              disabled={isUploading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>ถ่ายรูปด้วยกล้อง</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 10MB
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto max-h-96 object-contain"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-center gap-4">
                {/* Switch Camera Button (only on mobile with multiple cameras) */}
                <button
                  type="button"
                  onClick={switchCamera}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  title="สลับกล้อง"
                >
                </button>

                {/* Capture Button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={isUploading}
                  className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50"
                  title="ถ่ายรูป"
                >
                  <div className="w-full h-full bg-white rounded-full"></div>
                </button>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-12 h-12 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  title="ยกเลิก"
                >
                  <span>X</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            กดปุ่มกลมเพื่อถ่ายรูป หรือกดปุ่ม X เพื่อยกเลิก
          </div>
        </div>
      )}
    </div>
  )
}

