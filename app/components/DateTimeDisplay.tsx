'use client'

import { useState, useEffect, useMemo } from 'react'

// ===== Special Occasion System =====
interface SpecialOccasion {
  name: string
  emoji: string
  greeting: string
  floatingEmojis: string[]
  gradient: string
  iconBg: string
  iconBorder: string
  accentColor: string
}

function getSpecialOccasion(date: Date): SpecialOccasion | null {
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (month === 1 && day === 1) {
    return {
      name: 'ปีใหม่',
      emoji: '🎉',
      greeting: 'สวัสดีปีใหม่! 🎊',
      floatingEmojis: ['🎉', '🎊', '✨', '🥳', '🎆'],
      gradient: 'from-yellow-500/10 via-amber-500/5 to-transparent',
      iconBg: 'rgba(234, 179, 8, 0.15)',
      iconBorder: 'rgba(234, 179, 8, 0.3)',
      accentColor: '#EAB308',
    }
  }

  if (month === 2 && day === 14) {
    return {
      name: 'วาเลนไทน์',
      emoji: '💕',
      greeting: "Happy Valentine's Day 💕",
      floatingEmojis: ['❤️', '💕', '💖', '💗', '💘', '🩷', '🌹'],
      gradient: 'from-pink-500/15 via-rose-400/8 to-transparent',
      iconBg: 'rgba(236, 72, 153, 0.15)',
      iconBorder: 'rgba(236, 72, 153, 0.35)',
      accentColor: '#EC4899',
    }
  }

  if (month === 4 && day >= 13 && day <= 15) {
    return {
      name: 'สงกรานต์',
      emoji: '💦',
      greeting: 'สุขสันต์วันสงกรานต์! 🎉',
      floatingEmojis: ['💦', '🔫', '🏖️', '☀️', '🎉', '🐘'],
      gradient: 'from-cyan-500/10 via-blue-400/5 to-transparent',
      iconBg: 'rgba(6, 182, 212, 0.15)',
      iconBorder: 'rgba(6, 182, 212, 0.3)',
      accentColor: '#06B6D4',
    }
  }

  return null // เพิ่มเทศกาลอื่นๆ ได้ตามต้องการ
}

// ===== Floating Emoji Component =====
function FloatingEmojis({ emojis }: { emojis: string[] }) {
  const particles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: 5 + Math.random() * 90,
      delay: i * 0.3 + Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1,
      size: 12 + Math.random() * 8,
      // ตำแหน่งสุดท้ายที่จะหยุดค้างอยู่ (สุ่มให้กระจาย)
      endY: -(20 + Math.random() * 50),
      endX: (Math.random() - 0.5) * 30,
      endRotate: (Math.random() - 0.5) * 20,
    }))
  }, [emojis])

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="floating-emoji"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}px`,
            ['--endY' as string]: `${p.endY}px`,
            ['--endX' as string]: `${p.endX}px`,
            ['--endR' as string]: `${p.endRotate}deg`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </>
  )
}

// ===== Main Component =====
export default function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatThaiDate = (date: Date) => {
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Memoize occasion ตาม month+day เท่านั้น — ไม่เปลี่ยนทุกวินาที
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const occasion = useMemo(
    () => (currentTime ? getSpecialOccasion(currentTime) : null),
    [currentTime?.getMonth(), currentTime?.getDate()]
  )

  // Memoize emojis array reference เพื่อไม่ให้ FloatingEmojis re-mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableEmojis = useMemo(() => occasion?.floatingEmojis ?? [], [occasion?.name])

  if (!mounted || !currentTime) return null

  const iconBg = occasion?.iconBg ?? 'rgba(194, 166, 106, 0.15)'
  const iconBorder = occasion?.iconBorder ?? 'rgba(194, 166, 106, 0.3)'
  const accentColor = occasion?.accentColor ?? '#C2A66A'
  const gradientClass = occasion
    ? `bg-gradient-to-br ${occasion.gradient}`
    : 'bg-gradient-to-br from-[var(--app-btn-primary)]/5 via-transparent to-transparent'

  return (
    <div className="bg-app-card rounded-xl border border-app p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
      <div className={`absolute inset-0 ${gradientClass} opacity-60 pointer-events-none`} />

      {occasion && <FloatingEmojis emojis={stableEmojis} />}

      {occasion && (
        <style>{`
          .floating-emoji {
            position: absolute;
            bottom: 0;
            opacity: 0;
            pointer-events: none;
            z-index: 1;
            will-change: transform, opacity;
            animation: floatOnce ease-out forwards;
          }
          @keyframes floatOnce {
            0% {
              transform: translate3d(0, 0, 0) scale(0) rotate(0deg);
              opacity: 0;
            }
            40% {
              opacity: 0.7;
              transform: translate3d(calc(var(--endX) * 0.5), calc(var(--endY) * 0.5), 0) scale(1.1) rotate(calc(var(--endR) * 0.5));
            }
            100% {
              transform: translate3d(var(--endX), var(--endY), 0) scale(0.8) rotate(var(--endR));
              opacity: 0.4;
            }
          }
        `}</style>
      )}

      <div className="relative flex items-center gap-5" style={{ zIndex: 2 }}>
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-all duration-500"
          style={{ backgroundColor: iconBg, border: `1px solid ${iconBorder}` }}
        >
          {occasion ? (
            <span className="text-3xl" style={{ lineHeight: 1 }}>{occasion.emoji}</span>
          ) : (
            <svg className="w-7 h-7" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold text-app-heading tracking-tight">
              {formatThaiDate(currentTime)}
            </span>
          </div>

          {occasion && (
            <div className="text-sm font-semibold mb-1.5 animate-pulse" style={{ color: accentColor }}>
              {occasion.greeting}
            </div>
          )}

          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-app-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-mono font-bold text-app-heading tracking-wider" style={{ letterSpacing: '0.05em', color: accentColor }}>
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}