'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import AutoBreadcrumbs from './AutoBreadcrumbs'

type NavRole = 'ADMIN' | 'TECHNICIAN' | 'CLIENT'

interface AppLayoutProps {
  role: NavRole
  username?: string
  fullName?: string | null
  siteName?: string | null
  lineUserId?: string | null
  children: React.ReactNode
}

export default function AppLayout({ role, username, fullName, siteName, lineUserId, children }: AppLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // มือถือ: เมื่อเปิด Sidebar ให้ lock overflow ที่ body ป้องกัน layout overflow / horizontal scroll
  useEffect(() => {
    if (typeof window === 'undefined') return
    const isNarrow = window.matchMedia('(max-width: 1023px)').matches
    if (isNarrow && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMobileMenuOpen])

  // ไม่แสดง Sidebar/Header บนหน้า welcome/login
  if (pathname === '/welcome' || pathname === '/login') {
    return <>{children}</>
  }

  return (
    // 🔥 Flex Container ที่สูงเต็มจอและห้าม Scroll ที่ Body หลัก (มือถือ: ป้องกันเนื้อหาถูกบีบ)
    <div className="flex h-screen min-h-0 w-full min-w-0 overflow-hidden bg-app-bg" style={{ position: 'relative' }}>
      {/* Sidebar: ไม่แสดงตอนพิมพ์ */}
      <div className="print:hidden">
        <Sidebar
          role={role}
          lineUserId={lineUserId}
          isMobileOpen={isMobileMenuOpen}
          onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      </div>

      {/* Content Area: z-0 ให้ overlay/sidebar ที่ portaled ไป body ทับได้แน่นอน */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden relative z-0 transition-all duration-300 lg:w-auto">
        {/* Header: ไม่แสดงตอนพิมพ์ */}
        <div className="print:hidden">
          <Header
            role={role}
            username={username}
            fullName={fullName}
            siteName={siteName}
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </div>

        {/* 🔥 Main Scroll Area: ให้ Scroll เฉพาะเนื้อหาตรงนี้ */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scroll-smooth print:p-0" key={pathname} style={{ viewTransitionName: 'main-content' }}>
          <div className="w-full max-w-full min-w-0 min-h-full">
            {/* Breadcrumb - ไม่แสดงตอนพิมพ์ */}
            <div className="print:hidden">
              <AutoBreadcrumbs />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
