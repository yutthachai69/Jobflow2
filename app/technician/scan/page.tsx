'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useConfirm } from '@/app/components/ConfirmModal'

export default function ScanQRPage() {
  const router = useRouter()
  const { confirm, ConfirmDialog } = useConfirm()
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const html5QrCodeRef = useRef<any>(null)
  const scannedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => { })
        html5QrCodeRef.current.clear().catch(() => { })
      }
    }
  }, [])

  const startScanning = async () => {
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

            // ค้นหา Asset จาก QR Code แล้ว redirect ไปหน้า Asset Detail
            // ตรวจสอบว่าเป็น URL หรือไม่
            try {
              const url = new URL(decodedText)
              if (url.origin === window.location.origin) {
                router.push(url.pathname + url.search)
                return
              }
              const openLink = await confirm({
                title: 'พบลิงก์ภายนอก',
                message: decodedText,
                confirmText: 'เปิดลิงก์',
                cancelText: 'ยกเลิก',
                variant: 'info',
              })
              if (openLink) window.open(decodedText, '_blank')
              return
            } catch {
              // ไม่ใช่ URL
            }

            const response = await fetch(`/api/assets/find?qrCode=${encodeURIComponent(decodedText)}`)
            const data = await response.json()
            if (data.assetId) {
              router.push(`/assets/${data.assetId}`)
            } else {
              toast(`ข้อมูลที่สแกนได้: ${decodedText}`, { icon: '📷', duration: 5000 })
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
      setError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตให้ใช้งานกล้อง')
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setScanning(true)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('qr-reader')

      try {
        const decodedText = await html5QrCode.scanFile(file, false)

        try {
          const url = new URL(decodedText)
          if (url.origin === window.location.origin) {
            router.push(url.pathname + url.search)
            return
          }
          const openLink = await confirm({
            title: 'พบลิงก์ภายนอกในรูปภาพ',
            message: decodedText,
            confirmText: 'เปิดลิงก์',
            cancelText: 'ยกเลิก',
            variant: 'info',
          })
          if (openLink) window.open(decodedText, '_blank')
          setScanning(false)
          return
        } catch {
          // ไม่ใช่ URL
        }

        const response = await fetch(`/api/assets/find?qrCode=${encodeURIComponent(decodedText)}`)
        const data = await response.json()
        if (data.assetId) {
          router.push(`/assets/${data.assetId}`)
        } else {
          toast(`ข้อมูลในรูปภาพ: ${decodedText}`, { icon: '📷', duration: 5000 })
          setScanning(false)
        }
      } catch (scanErr) {
        setError('ไม่พบ QR Code ในรูปภาพนี้ กรุณาลองใช้รูปอื่น')
        setScanning(false)
      }
    } catch (err: any) {
      setError(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err?.message || err}`)
      setScanning(false)
    } finally {
      e.target.value = ''
    }
  }

  const handleSelectImage = () => {
    fileInputRef.current?.click()
  }

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.querySelector('input[name="qrCode"]') as HTMLInputElement
    const qrCodeValue = input?.value.trim()

    if (!qrCodeValue) {
      setError('กรุณากรอกรหัส QR Code')
      return
    }

    setError(null)

    try {
      const response = await fetch(`/api/assets/find?qrCode=${encodeURIComponent(qrCodeValue)}`)
      const data = await response.json()
      if (data.assetId) {
        router.push(`/assets/${data.assetId}`)
      } else {
        setError('ไม่พบเครื่องปรับอากาศที่ระบุ')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
    }
  }

  return (
    <>
      <ConfirmDialog />
      <div className="min-h-screen bg-app-bg p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-app-heading mb-2">
              สแกน QR Code
            </h1>
            <p className="text-app-body">
              สแกน QR Code บนตัวแอร์เพื่อดูประวัติเครื่อง
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

            <div className="flex flex-col sm:flex-row gap-3">
              {!scanning ? (
                <>
                  <button
                    onClick={startScanning}
                    className="flex-1 btn-app-primary px-6 py-3 rounded-lg hover:shadow-md font-medium text-lg transition-all"
                  >
                    เปิดกล้องสแกน
                  </button>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={handleSelectImage}
                      className="w-full bg-app-card border-2 border-[var(--app-btn-primary)] text-[var(--app-btn-primary)] px-6 py-3 rounded-lg hover:bg-app-section font-medium text-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      เลือกรูป/แกลเลอรี่
                    </button>
                  </div>
                </>
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
              หรือพิมพ์รหัส QR Code
            </h2>
            <form
              className="flex gap-2"
              onSubmit={handleManualSubmit}
            >
              <input
                type="text"
                name="qrCode"
                placeholder="พิมพ์รหัส QR Code"
                className="flex-1 border border-app rounded-lg px-4 py-3 text-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] placeholder:text-app-muted transition-all font-mono"
              />
              <button
                type="submit"
                className="btn-app-primary px-6 py-3 rounded-lg font-medium whitespace-nowrap"
              >
                ค้นหา
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
