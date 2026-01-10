'use client'

import { useState } from 'react'

export default function SetupDatabaseButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSetup = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setMessage('✅ Setup สำเร็จ! Database พร้อมใช้งานแล้ว')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage('❌ Setup ไม่สำเร็จ: ' + data.message)
        console.error('Setup error:', data)
      }
    } catch (err: any) {
      setMessage('❌ Error: ' + err.message)
      console.error('Setup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
      <p className="text-sm text-yellow-800 font-medium">⚠️ ฐานข้อมูลยังไม่พร้อม</p>
      <p className="text-sm text-yellow-700 mt-2">
        กรุณา setup database ก่อน (จะสร้าง schema + seed อัตโนมัติ)
      </p>
      <button
        onClick={handleSetup}
        disabled={isLoading}
        className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
      >
        {isLoading ? '⏳ กำลัง setup...' : '🔧 Setup Database'}
      </button>
      {message && (
        <p className={`text-xs mt-2 ${message.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>
          {message}
        </p>
      )}
      <p className="text-xs text-yellow-600 mt-2">
        หรือใช้ Browser Console: <code className="bg-yellow-100 px-1 rounded text-xs">fetch('/api/setup', {`{method: 'POST'}`}).then(r => r.json()).then(console.log)</code>
      </p>
    </div>
  )
}

