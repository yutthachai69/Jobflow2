'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function ScanQRPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const html5QrCodeRef = useRef<any>(null)
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
              if (window.confirm(`พบลิงก์ภายนอก:\n${decodedText}\n\nต้องการเปิดลิงก์นี้หรือไม่?`)) {
                window.open(decodedText, '_blank')
              }
              return
            } catch {
              // ไม่ใช่ URL
            }

            const response = await fetch(`/api/assets/find?qrCode=${encodeURIComponent(decodedText)}`)
            const data = await response.json()
            if (data.assetId) {
              router.push(`/assets/${data.assetId}`)
            } else {
              alert(`ข้อมูลที่สแกนได้:\n${decodedText}`)
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
          if (window.confirm(`พบลิงก์ภายนอกในรูปภาพ:\n${decodedText}\n\nต้องการเปิดลิงก์นี้หรือไม่?`)) {
            window.open(decodedText, '_blank')
          }
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
          alert(`ข้อมูลในรูปภาพ:\n${decodedText}`)
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
    if (window.confirm('ต้องการเปิดคลังรูปภาพเพื่อสแกน QR Code ใช่หรือไม่?')) {
      fileInputRef.current?.click()
    }
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            สแกน QR Code
          </h1>
          <p className="text-gray-600">
            สแกน QR Code บนตัวแอร์เพื่อดูประวัติเครื่อง
          </p>
        </div>

        {/* Scanner Area */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div id="qr-reader" className="w-full mb-4"></div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {!scanning ? (
              <>
                <button
                  onClick={startScanning}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium text-lg"
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
                    className="w-full bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium text-lg flex items-center justify-center gap-2"
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
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium text-lg"
              >
                หยุดสแกน
              </button>
            )}
          </div>
        </div>

        {/* Manual Input */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
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
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium whitespace-nowrap"
            >
              ค้นหา
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
