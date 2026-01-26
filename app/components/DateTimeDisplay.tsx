'use client'

import { useState, useEffect } from 'react'

export default function DateTimeDisplay() {
  // เริ่มต้นด้วย null เพื่อหลีกเลี่ยง hydration mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Set mounted flag และ initial time
    setMounted(true)
    setCurrentTime(new Date())

    // อัพเดทเวลาทุกวินาที
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // แปลงวันที่เป็นภาษาไทย
  const formatThaiDate = (date: Date) => {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]
    
    const day = date.getDate()
    const month = thaiMonths[date.getMonth()]
    const year = date.getFullYear() + 543 // แปลงเป็น พ.ศ.
    
    return `${day} ${month} ${year}`
  }

  // แปลงเวลาเป็น HH:MM:SS
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  // ถ้ายังไม่ mount ให้แสดง placeholder (server และ client จะ render เหมือนกัน)
  if (!mounted || !currentTime) {
    return (
      <div className="bg-app-card rounded-xl border border-app p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--app-btn-primary)]/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md" style={{ 
            backgroundColor: 'rgba(194, 166, 106, 0.15)',
            border: '1px solid rgba(194, 166, 106, 0.3)'
          }}>
            <svg className="w-7 h-7" style={{ color: '#C2A66A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-app-heading tracking-tight">
                กำลังโหลด...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-app-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span 
                className="text-lg font-mono font-bold text-app-heading tracking-wider" 
                style={{ 
                  letterSpacing: '0.05em',
                  color: 'var(--app-btn-primary)'
                }}
              >
                --:--:--
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // หลังจาก mount แล้วค่อยแสดงเวลาจริง
  return (
    <div className="bg-app-card rounded-xl border border-app p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--app-btn-primary)]/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="relative flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md" style={{ 
          backgroundColor: 'rgba(194, 166, 106, 0.15)',
          border: '1px solid rgba(194, 166, 106, 0.3)'
        }}>
          <svg className="w-7 h-7" style={{ color: '#C2A66A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-app-heading tracking-tight">
              {formatThaiDate(currentTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-app-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span 
              className="text-lg font-mono font-bold text-app-heading tracking-wider" 
              style={{ 
                letterSpacing: '0.05em',
                color: 'var(--app-btn-primary)'
              }}
            >
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
