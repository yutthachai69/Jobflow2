'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function ScanQRPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const html5QrCodeRef = useRef<any>(null)
  const scannedRef = useRef(false)

  // ตรวจสอบ error จาก URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    if (errorParam === 'not_found') {
      setError('ไม่พบทรัพย์สินที่ระบุ')
    }
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
        html5QrCodeRef.current.clear().catch(() => {})
      }
    }
  }, [])

  const startScanning = async () => {
    // 1. Check for Secure Context (HTTPS or Localhost) first
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setError('กล้องไม่สามารถใช้งานได้บนการเชื่อมต่อที่ไม่ปลอดภัย (HTTP) กรุณาใช้ HTTPS หรือ localhost')
      return
    }

    try {
      setError(null)
      setScanning(true)
      scannedRef.current = false

      // Dynamic import html5-qrcode
      const { Html5Qrcode } = await import('html5-qrcode')
      const qrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = qrCode
      
      await qrCode.start(
        { facingMode: 'environment' }, // ใช้กล้องหลัง
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText: string) => {
          // สแกนสำเร็จ!
          if (scannedRef.current) return // ป้องกันการสแกนซ้ำ
          scannedRef.current = true
          
          try {
            await qrCode.stop()
            await qrCode.clear()
            setScanning(false)
            html5QrCodeRef.current = null
            
            // ตรวจสอบว่าเป็น URL ของเราเองหรือไม่
            try {
              const url = new URL(decodedText)
              // ถ้าเป็น URL ของเราเอง ให้ redirect ไปที่ URL นั้น
              if (url.origin === window.location.origin) {
                router.push(url.pathname + url.search)
                return
              }
            } catch {
              // ไม่ใช่ URL ให้ค้นหาจาก QR Code text
            }
            
            // ถ้าไม่ใช่ URL หรือไม่ใช่ URL ของเรา ให้ค้นหา Asset จาก QR Code
            const response = await fetch(`/api/assets/find?qrCode=${encodeURIComponent(decodedText)}`)
            const data = await response.json()
            if (data.assetId) {
              router.push(`/assets/${data.assetId}`)
            } else {
              setError('ไม่พบทรัพย์สินที่ระบุ')
              setScanning(false)
            }
          } catch (err) {
            setScanning(false)
            html5QrCodeRef.current = null
            setError('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
          }
        },
        () => {
          // ยังไม่สแกนเจอ (ไม่ต้องแสดง error)
        }
      )
    } catch (err: any) {
      console.error('Error starting camera:', err)
      let errorMessage = 'ไม่สามารถเปิดกล้องได้'
      
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
         errorMessage = 'กรุณาอนุญาตให้ใช้งานกล้องในตั้งค่าของ Browser'
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
         errorMessage = 'ไม่พบกล้องในอุปกรณ์นี้'
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
         errorMessage = 'กล้องถูกใช้งานโดยโปรแกรมอื่น หรือมีปัญหาในการเข้าถึง'
      }

      setError(errorMessage)
      setScanning(false)
      html5QrCodeRef.current = null
    }
  }

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        await html5QrCodeRef.current.clear()
      } catch (err) {
        console.error('Error stopping camera:', err)
      }
      html5QrCodeRef.current = null
    }
    setScanning(false)
  }

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const qrCodeInput = form.querySelector('input[name="qrCode"]') as HTMLInputElement
    const qrCodeUrlInput = form.querySelector('input[name="qrCodeUrl"]') as HTMLInputElement
    
    const qrCodeValue = qrCodeInput?.value.trim()
    const qrCodeUrlValue = qrCodeUrlInput?.value.trim()
    
    if (!qrCodeValue && !qrCodeUrlValue) {
      setError('กรุณากรอกรหัสทรัพย์สินหรือ URL')
      return
    }

    setError(null)
    
    try {
      // ถ้ามี URL ให้ตรวจสอบก่อน
      if (qrCodeUrlValue) {
        try {
          const url = new URL(qrCodeUrlValue)
          if (url.origin === window.location.origin) {
            router.push(url.pathname + url.search)
            return
          }
        } catch {
          // ไม่ใช่ URL ที่ถูกต้อง
        }
      }
      
      // ถ้ามีรหัสทรัพย์สิน ให้ค้นหาจาก QR Code
      if (qrCodeValue) {
        const response = await fetch(`/api/assets/find?qrCode=${encodeURIComponent(qrCodeValue)}`)
        const data = await response.json()
        if (data.assetId) {
          router.push(`/assets/${data.assetId}`)
          return
        }
      }
      
      setError('ไม่พบทรัพย์สินที่ระบุ')
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
    }
  }

  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-app-heading mb-2">
            สแกน QR Code
          </h1>
          <p className="text-app-body">
            สแกน QR Code บนทรัพย์สินเพื่อดูรายละเอียด
          </p>
        </div>

        {/* Scanner Area */}
        <div className="bg-app-card rounded-xl shadow-lg border border-app p-6 mb-6">
          <div id="qr-reader" className="w-full mb-4"></div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="flex-1 btn-app-primary px-6 py-3 rounded-lg hover:shadow-md font-medium text-lg transition-all"
              >
                เปิดกล้องสแกน
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium text-lg transition-colors"
              >
                หยุดสแกน
              </button>
            )}
          </div>
        </div>

        {/* Manual Input */}
        <div className="bg-app-card rounded-xl shadow-lg border border-app p-6">
          <h2 className="text-lg font-bold text-app-heading mb-4">
            หรือกรอกรหัสทรัพย์สินโดยตรง
          </h2>
          <form 
            className="space-y-4"
            onSubmit={handleManualSubmit}
          >
            <div>
              <label className="block text-sm font-medium text-app-body mb-2">
                รหัสทรัพย์สิน (QR Code)
              </label>
              <input
                type="text"
                name="qrCode"
                placeholder="พิมพ์รหัสทรัพย์สิน เช่น AC-2024-001"
                className="w-full border border-app rounded-lg px-4 py-3 text-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] placeholder:text-app-muted transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-body mb-2">
                หรือ URL จาก QR Code
              </label>
              <input
                type="text"
                name="qrCodeUrl"
                placeholder="วาง URL ที่ได้จาก QR Code"
                className="w-full border border-app rounded-lg px-4 py-3 text-base bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] placeholder:text-app-muted transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full btn-app-primary px-6 py-3 rounded-lg hover:shadow-md font-medium transition-all"
            >
              ค้นหา
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
