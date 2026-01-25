'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import เพื่อหลีกเลี่ยง SSR issues
const Snowfall = dynamic(
  () => import('react-snowfall').then((mod) => mod.Snowfall),
  { ssr: false }
)

export default function SnowfallEffect() {
  const [isClient, setIsClient] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // ตรวจสอบ prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // ไม่แสดงหิมะถ้ายังไม่โหลด client หรือผู้ใช้ต้องการลดการเคลื่อนไหว
  if (!isClient || prefersReducedMotion) {
    return null
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Snowfall
        // สีหิมะ - ใช้สีฟ้าอ่อนเพื่อให้เห็นบนพื้นหลังสีขาว
        color="#bfdbfe"
        // จำนวนหิมะ (ปรับได้ตามต้องการ - ลดลงเพื่อ performance)
        snowflakeCount={50}
        // ขนาดหิมะ (สุ่มระหว่าง 3.0 ถึง 10.0) - ขยายให้ใหญ่ขึ้น
        radius={[3.0, 10.0]}
        // ความเร็ว (ช้าๆ เพื่อให้ดูนุ่มนวล)
        speed={[0.5, 2.0]}
        // แรงลม (เบาๆ)
        wind={[-0.5, 1.0]}
        // ความโปร่งใส
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}
