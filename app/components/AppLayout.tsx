'use client'

import { useState } from 'react'
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
  children: React.ReactNode
}

export default function AppLayout({ role, username, fullName, siteName, children }: AppLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // ไม่แสดง Sidebar/Header บนหน้า welcome/login
  if (pathname === '/welcome' || pathname === '/login') {
    return <>{children}</>
  }

  return (
    // 🔥 Flex Container ที่สูงเต็มจอและห้าม Scroll ที่ Body หลัก
    <div className="flex h-screen overflow-hidden bg-app-bg" style={{ position: 'relative' }}>
      {/* Sidebar: ส่ง Props ควบคุม Mobile Menu - ซ่อนในมือถือ (hidden lg:flex) */}
      <Sidebar 
        role={role}
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Content Area: ส่วนขวามือ - เต็มหน้าจอในมือถือ */}
      <div className="flex-1 flex flex-col min-w-0 relative transition-all duration-300 w-full lg:w-auto">
        {/* Header: ส่ง User Data ไปแสดงผล */}
        <Header 
          role={role}
          username={username}
          fullName={fullName}
          siteName={siteName}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* 🔥 Main Scroll Area: ให้ Scroll เฉพาะเนื้อหาตรงนี้ */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scroll-smooth" key={pathname}>
          <div className="max-w-7xl mx-auto min-h-full page-transition">
            {/* Breadcrumb Navigation - แสดงในทุกหน้า */}
            <AutoBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
