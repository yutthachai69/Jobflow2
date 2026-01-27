'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image' // เพิ่ม Image component
import {
  IconDashboard,
  IconWorkOrder,
  IconAssets,
  IconUsers,
  IconLocations,
  IconSecurity,
  IconContact,
  IconScan,
  IconWrench,
  IconReports,
  IconSurvey,
} from './SidebarIcons'

type NavRole = 'ADMIN' | 'TECHNICIAN' | 'CLIENT'

type IconKey = 'dashboard' | 'workorder' | 'assets' | 'users' | 'locations' | 'security' | 'contact' | 'scan' | 'wrench' | 'reports' | 'survey'

const iconMap: Record<IconKey, React.ComponentType<{ active?: boolean }>> = {
  dashboard: IconDashboard,
  workorder: IconWorkOrder,
  assets: IconAssets,
  users: IconUsers,
  locations: IconLocations,
  security: IconSecurity,
  contact: IconContact,
  scan: IconScan,
  wrench: IconWrench,
  reports: IconReports,
  survey: IconSurvey,
}

type NavLink = { type: 'link'; href: string; label: string; icon: IconKey }
type NavGroup = { type: 'group'; label: string; icon: IconKey; subItems: { href: string; label: string }[] }
type NavItem = NavLink | NavGroup

interface SidebarProps {
  role: NavRole
  isMobileOpen?: boolean
  onMobileToggle?: () => void
}

const SIDEBAR_COLLAPSED_KEY = 'airservice-sidebar-collapsed'

export default function Sidebar({ role, isMobileOpen: externalIsOpen, onMobileToggle }: SidebarProps) {
  const pathname = usePathname()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [reportsExpanded, setReportsExpanded] = useState(false)
  
  // ใช้ state จาก props ถ้ามี หรือใช้ internal state
  const isMobileOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const handleToggle = onMobileToggle || (() => setInternalIsOpen(!internalIsOpen))

  // Load collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      setIsCollapsed(stored === 'true')
    } catch {
      // ignore
    }
    setMounted(true)
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState))
      window.dispatchEvent(new Event('sidebar-toggle'))
    } catch {
      // ignore
    }
  }

  // ไม่แสดง Sidebar บนหน้า welcome/login
  if (pathname === '/welcome' || pathname === '/login') {
    return null
  }

  const adminItems: NavItem[] = [
    { type: 'link', href: '/', label: 'Dashboard', icon: 'dashboard' },
    { type: 'link', href: '/work-orders', label: 'ใบสั่งงาน', icon: 'workorder' },
    { type: 'link', href: '/assets', label: 'ทรัพย์สินและอุปกรณ์', icon: 'assets' },
    { type: 'link', href: '/scan', label: 'สแกน QR Code', icon: 'scan' },
    { type: 'link', href: '/users', label: 'ผู้ใช้งาน', icon: 'users' },
    { type: 'link', href: '/locations', label: 'สถานที่', icon: 'locations' },
    { type: 'link', href: '/security-incidents', label: 'ความปลอดภัย', icon: 'security' },
    { type: 'link', href: '/contact', label: 'ติดต่อเรา', icon: 'contact' },
  ]

  // เมนูหลักสำหรับ CLIENT
  const clientMainMenuItems: NavItem[] = [
    { type: 'link', href: '/', label: 'Dashboard', icon: 'dashboard' },
    { type: 'link', href: '/assets', label: 'ทรัพย์สินและอุปกรณ์', icon: 'assets' },
    { type: 'link', href: '/scan', label: 'สแกน QR Code', icon: 'scan' },
    { type: 'link', href: '/work-orders', label: 'ประวัติงาน', icon: 'workorder' },
    {
      type: 'group',
      label: 'รายงาน',
      icon: 'reports',
      subItems: [
        { href: '/reports/maintenance', label: 'การบำรุงรักษา' },
        { href: '/reports/repair', label: 'การซ่อม' },
      ],
    },
  ]

  // เมนูเสริมสำหรับ CLIENT
  const clientSupplementaryMenuItems: NavItem[] = [
    { type: 'link', href: '/survey', label: 'แบบสำรวจ', icon: 'survey' },
    { type: 'link', href: '/contact', label: 'ติดต่อเรา', icon: 'contact' },
  ]

  const technicianItems: NavItem[] = [
    { type: 'link', href: '/', label: 'Dashboard', icon: 'dashboard' },
    { type: 'link', href: '/scan', label: 'สแกน QR Code', icon: 'scan' },
    { type: 'link', href: '/technician', label: 'หน้างาน', icon: 'wrench' },
    { type: 'link', href: '/work-orders', label: 'ประวัติงาน', icon: 'workorder' },
  ]

  const items = role === 'ADMIN' ? adminItems : role === 'CLIENT' ? [] : technicianItems

  useEffect(() => {
    if (pathname?.startsWith('/reports')) setReportsExpanded(true)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  // Mobile Menu Button (Fixed Position)
  const MobileMenuButton = () => (
    <button
      onClick={handleToggle}
      className={`lg:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all shadow-md ${
        isMobileOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="เปิดเมนู"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <MobileMenuButton />

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden transition-opacity"
          onClick={handleToggle}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-app-section border-r border-app z-[60] transition-all duration-300 ease-in-out flex-shrink-0 flex-col
          ${isMobileOpen ? 'flex translate-x-0 shadow-2xl' : 'hidden -translate-x-full lg:flex lg:translate-x-0'} 
          ${mounted && isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Header: Logo & Collapse Button */}
        <div className={`flex items-center justify-between border-b border-app ${isCollapsed ? 'p-3 flex-col gap-4' : 'p-5'}`}>
          
          {/* Logo */}
          <Link 
            href="/" 
            className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'} group/logo transition-all`}
            onClick={() => isMobileOpen && handleToggle()} // ปิดเมนูเมื่อคลิกโลโก้บนมือถือ
          >
            <div className="relative">
              {/* Glow effect (Background) */}
              {!isCollapsed && (
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
              )}
              
              <Image
                src="/flomac.png"
                alt="Flomac"
                width={220}
                height={70}
                className={`object-contain object-left transition-all duration-300 relative z-10 drop-shadow-md dark:brightness-125 dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] ${
                  isCollapsed ? 'h-8 w-auto' : 'h-16 md:h-[4.25rem] w-auto'
                }`}
                priority
              />
            </div>
            
            {!isCollapsed && (
              <span className="text-2xl font-serif font-bold whitespace-nowrap transition-opacity duration-300 text-slate-800 dark:text-white tracking-tight drop-shadow-sm">
                Flomac
              </span>
            )}
          </Link>

          {/* Close Button (Mobile Only) */}
          <button
            onClick={handleToggle}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg absolute right-4 top-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Collapse Button (Desktop Only) */}
          <button
            onClick={toggleCollapse}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-app-card border border-app text-app-body hover:text-app-heading hover:bg-app-section transition-all shadow-sm
              ${isCollapsed ? 'mx-auto mt-2' : ''}
            `}
            title={isCollapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'} space-y-1`}>
          {/* สำหรับ CLIENT: แสดงเมนูหลักและเมนูเสริม */}
          {role === 'CLIENT' ? (
            <>
              {/* เมนูหลัก */}
              {!isCollapsed && (
                <div className="mb-2 px-2">
                  <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider">
                    เมนูหลัก
                  </h3>
                </div>
              )}
              {clientMainMenuItems.map((item) => {
                // --- Single Link Item ---
                if (item.type === 'link') {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobileOpen && handleToggle()}
                      className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative
                        ${isCollapsed ? 'justify-center p-3 w-full' : 'px-4 py-3 gap-3'}
                        ${active 
                          ? 'bg-[var(--app-btn-primary)] text-white shadow-md' 
                          : 'text-app-body hover:bg-app-card hover:text-app-heading'
                        }
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {(() => {
                        const Icon = iconMap[item.icon]
                        return Icon ? <Icon active={active} /> : null
                      })()}
                      
                      {!isCollapsed && (
                        <span className="whitespace-nowrap transition-all duration-300">
                          {item.label}
                        </span>
                      )}

                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  )
                }

                // --- Group Item (Dropdown) ---
                const group = item as NavGroup
                const hasActiveSub = group.subItems.some((s) => isActive(s.href))
                const Icon = iconMap[group.icon]

                if (isCollapsed) {
                  const firstHref = group.subItems[0]?.href ?? '/reports'
                  return (
                    <Link
                      key={group.label}
                      href={firstHref}
                      onClick={() => isMobileOpen && handleToggle()}
                      className={`flex items-center justify-center p-3 rounded-lg transition-all group relative
                        ${hasActiveSub ? 'bg-[var(--app-btn-primary)]/10 text-[var(--app-btn-primary)]' : 'text-app-body hover:bg-app-card'}
                      `}
                      title={group.label}
                    >
                      {Icon && <Icon active={hasActiveSub} />}
                      <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                        {group.label}
                      </div>
                    </Link>
                  )
                }

                return (
                  <div key={group.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setReportsExpanded((v) => !v)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${hasActiveSub ? 'bg-[var(--app-btn-primary)]/5 text-[var(--app-btn-primary)]' : 'text-app-body hover:bg-app-card'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon active={hasActiveSub} />}
                        <span>{group.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${reportsExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {reportsExpanded && (
                      <div className="ml-4 pl-3 border-l-2 border-app space-y-1 mt-1">
                        {group.subItems.map((sub) => {
                          const subActive = isActive(sub.href)
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => isMobileOpen && handleToggle()}
                              className={`block px-3 py-2 text-sm rounded-lg transition-all
                                ${subActive 
                                  ? 'text-[var(--app-btn-primary)] font-semibold bg-[var(--app-btn-primary)]/5' 
                                  : 'text-app-muted hover:text-app-heading hover:bg-app-card'
                                }
                              `}
                            >
                              {sub.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Divider */}
              {!isCollapsed && (
                <div className="my-4 mx-2 border-t border-app-border"></div>
              )}

              {/* เมนูเสริม */}
              {!isCollapsed && (
                <div className="mb-2 px-2">
                  <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider">
                    เมนูเสริม
                  </h3>
                </div>
              )}
              {clientSupplementaryMenuItems.map((item) => {
                if (item.type !== 'link') return null
                const linkItem = item as NavLink
                const active = isActive(linkItem.href)
                return (
                  <Link
                    key={linkItem.href}
                    href={linkItem.href}
                    onClick={() => isMobileOpen && handleToggle()}
                    className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative
                      ${isCollapsed ? 'justify-center p-3 w-full' : 'px-4 py-3 gap-3'}
                      ${active 
                        ? 'bg-[var(--app-btn-primary)] text-white shadow-md' 
                        : 'text-app-body hover:bg-app-card hover:text-app-heading'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {(() => {
                      const Icon = iconMap[item.icon]
                      return Icon ? <Icon active={active} /> : null
                    })()}
                    
                    {!isCollapsed && (
                      <span className="whitespace-nowrap transition-all duration-300">
                        {item.label}
                      </span>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </Link>
                )
              })}
            </>
          ) : (
            // สำหรับ ADMIN และ TECHNICIAN: แสดง items ปกติ
            items.map((item) => {
              // --- Single Link Item ---
              if (item.type === 'link') {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => isMobileOpen && handleToggle()}
                    className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative
                      ${isCollapsed ? 'justify-center p-3 w-full' : 'px-4 py-3 gap-3'}
                      ${active 
                        ? 'bg-[var(--app-btn-primary)] text-white shadow-md' 
                        : 'text-app-body hover:bg-app-card hover:text-app-heading'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {(() => {
                      const Icon = iconMap[item.icon]
                      return Icon ? <Icon active={active} /> : null
                    })()}
                    
                    {!isCollapsed && (
                      <span className="whitespace-nowrap transition-all duration-300">
                        {item.label}
                      </span>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </Link>
                )
              }

              // --- Group Item (Dropdown) ---
              const group = item as NavGroup
              const hasActiveSub = group.subItems.some((s) => isActive(s.href))
              const Icon = iconMap[group.icon]

              if (isCollapsed) {
                const firstHref = group.subItems[0]?.href ?? '/reports'
                return (
                  <Link
                    key={group.label}
                    href={firstHref}
                    onClick={() => isMobileOpen && handleToggle()}
                    className={`flex items-center justify-center p-3 rounded-lg transition-all group relative
                      ${hasActiveSub ? 'bg-[var(--app-btn-primary)]/10 text-[var(--app-btn-primary)]' : 'text-app-body hover:bg-app-card'}
                    `}
                    title={group.label}
                  >
                    {Icon && <Icon active={hasActiveSub} />}
                    <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                      {group.label}
                    </div>
                  </Link>
                )
              }

              return (
                <div key={group.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setReportsExpanded((v) => !v)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${hasActiveSub ? 'bg-[var(--app-btn-primary)]/5 text-[var(--app-btn-primary)]' : 'text-app-body hover:bg-app-card'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon active={hasActiveSub} />}
                      <span>{group.label}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${reportsExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {reportsExpanded && (
                    <div className="ml-4 pl-3 border-l-2 border-app space-y-1 mt-1">
                      {group.subItems.map((sub) => {
                        const subActive = isActive(sub.href)
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => isMobileOpen && handleToggle()}
                            className={`block px-3 py-2 text-sm rounded-lg transition-all
                              ${subActive 
                                ? 'text-[var(--app-btn-primary)] font-semibold bg-[var(--app-btn-primary)]/5' 
                                : 'text-app-muted hover:text-app-heading hover:bg-app-card'
                              }
                            `}
                          >
                            {sub.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </nav>

        {/* Footer info */}
        <div className={`p-4 border-t border-app text-xs text-app-muted text-center transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
          {!isCollapsed ? (
            <>
              <p className="font-semibold text-app-heading">{process.env.NEXT_PUBLIC_APP_NAME || 'Flomac Service'}</p>
              <p className="opacity-75">v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.2'}</p>
            </>
          ) : (
            <p className="font-bold">v{process.env.NEXT_PUBLIC_APP_VERSION?.split('.').slice(0, 2).join('.') || '1.0'}</p>
          )}
        </div>
      </aside>
    </>
  )
}